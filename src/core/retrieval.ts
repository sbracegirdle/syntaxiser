import { EditorContext, RankedCard, ReferenceCard, ReferencePack } from './types';

export function tokenize(text: string): string[] {
  return (text.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().match(/[a-z][a-z0-9]*/g) ?? []);
}

const dot = (a: number[], b: number[]) => a.reduce((n, v, i) => n + v * (b[i] ?? 0), 0);
function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(dot(vector, vector));
  return norm ? vector.map(v => v / norm) : vector;
}

/** A deterministic, offline semantic encoder. Dimensions are curated concepts,
 * not neural model outputs. This interface can also hold a learned encoder later. */
export interface SemanticEncoder {
  encode(text: string): number[];
  encodeQuery?(text: string): number[];
  cardVector(card: ReferenceCard): number[];
}

export class ConceptEncoder implements SemanticEncoder {
  private readonly matchers;
  constructor(private readonly pack: ReferencePack) {
    this.matchers = pack.concepts.map(c => ({
      aliases: c.aliases.map(a => ` ${tokenize(a).join(' ')} `),
      patterns: c.patterns.map(p => new RegExp(p, 'i')),
    }));
  }
  encode(text: string): number[] {
    const words = ` ${tokenize(text).join(' ')} `;
    return normalize(this.matchers.map(m =>
      Math.min(3, m.aliases.reduce((sum, alias) => sum + (words.includes(alias) ? 1 : 0), 0))
      + (m.patterns.some(p => p.test(text)) ? 1.5 : 0)));
  }
  encodeQuery(text: string): number[] {
    const words = ` ${tokenize(text).join(' ')} `;
    // A search term is one concept cue, even when it also looks like Rust syntax.
    // Keep syntax patterns as a fallback for queries such as &[T] and Vec<T>.
    return normalize(this.matchers.map(m => m.aliases.some(a => words.includes(a)) ? 1
      : m.patterns.some(p => p.test(text)) ? 1.5 : 0));
  }
  cardVector(card: ReferenceCard): number[] {
    return normalize(this.pack.concepts.map(c => {
      const position = card.topics.indexOf(c.id);
      return position < 0 ? 0 : position === 0 ? 1 : 0.35;
    }));
  }
}

export class Retriever {
  private readonly entries;
  private readonly idf = new Map<string, number>();
  private readonly encoder: SemanticEncoder;

  constructor(readonly pack: ReferencePack, encoder?: SemanticEncoder) {
    this.encoder = encoder ?? new ConceptEncoder(pack);
    const documents = pack.cards.map(c => tokenize(`${c.title} ${c.keywords.join(' ')} ${c.code}`));
    for (const words of documents) {
      for (const word of new Set(words)) this.idf.set(word, (this.idf.get(word) ?? 0) + 1);
    }
    for (const [word, count] of this.idf) this.idf.set(word, Math.log(1 + documents.length / count));
    this.entries = pack.cards.map((card, i) => ({
      card,
      vector: this.encoder.cardVector(card),
      lexical: this.lexicalVector(documents[i] ?? []),
    }));
  }

  search(query: string, limit = 12): RankedCard[] {
    if (!query.trim()) return [];
    const vector = this.encoder.encodeQuery?.(query) ?? this.encoder.encode(query);
    const lexical = this.lexicalVector(tokenize(query));
    const concepts = vector.flatMap((weight, index) => weight > 0 ? [index] : []);
    return this.select(this.entries.map(e => {
      const coverage = concepts.length ? concepts.filter(index => (e.vector[index] ?? 0) > 0).length / concepts.length : 1;
      // Prefer cards covering the whole request over cards matching only one part.
      const score = (0.72 * dot(vector, e.vector) + 0.28 * this.lexicalSimilarity(lexical, e.lexical))
        * (0.5 + 0.5 * coverage);
      return { card: e.card, score };
    }).filter(r => r.score >= 0.06), limit);
  }

  relevant(context: EditorContext, limit = 12): RankedCard[] {
    const sources: [string, number][] = [
      [context.currentLine, 0.38], [context.local, 0.3], [context.cues.join(' '), 0.15],
      [context.recentEdits, 0.09], [context.symbols, 0.05], [context.imports, 0.03],
    ];
    const vectors = sources.map(([text, weight]) => ({ weight, vector: this.encoder.encode(text), lexical: this.lexicalVector(tokenize(text)) }));
    return this.select(this.entries.map(e => {
      let semantic = 0, lexical = 0;
      for (const source of vectors) {
        semantic += source.weight * dot(source.vector, e.vector);
        lexical += source.weight * this.lexicalSimilarity(source.lexical, e.lexical);
      }
      const fits = e.card.scopes.includes(context.scope);
      // File-level declarations should remain useful even on an empty line.
      const scopeWeight = context.scope === 'module' ? 0.42 : 0.12;
      return { card: e.card, score: 0.65 * semantic + 0.23 * lexical
        + (fits ? scopeWeight : -scopeWeight * 0.65) + (fits ? e.card.priority * 0.06 : 0) };
    }), limit);
  }

  private lexicalVector(words: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const w of words) if (this.idf.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
    let norm = 0;
    for (const [w, count] of counts) {
      const value = (1 + Math.log(count)) * (this.idf.get(w) ?? 0);
      counts.set(w, value); norm += value * value;
    }
    if (norm) for (const [w, value] of counts) counts.set(w, value / Math.sqrt(norm));
    return counts;
  }

  private lexicalSimilarity(a: Map<string, number>, b: Map<string, number>): number {
    let score = 0;
    for (const [word, value] of a) score += value * (b.get(word) ?? 0);
    return score;
  }

  private select(candidates: RankedCard[], limit: number): RankedCard[] {
    const result: RankedCard[] = [];
    const used = new Map<string, number>();
    while (result.length < limit && candidates.length) {
      candidates.sort((a, b) => {
        const adjusted = (r: RankedCard) => r.score - (used.get(r.card.topics[0] ?? '') ?? 0) * 0.055;
        return adjusted(b) - adjusted(a) || a.card.id.localeCompare(b.card.id);
      });
      const next = candidates.shift()!;
      result.push(next);
      const topic = next.card.topics[0] ?? '';
      used.set(topic, (used.get(topic) ?? 0) + 1);
    }
    return result;
  }
}
