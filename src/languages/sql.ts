import { ContextInput, EditorContext, LanguageAdapter, ReferencePack, SqlDialect } from '../core/types';

/** Mask literals, quoted identifiers and comments without changing cursor offsets. */
export function maskSql(text: string): string {
  let output = '', i = 0;
  const hide = (end: number) => {
    output += text.slice(i, end).replace(/[^\r\n]/g, ' ');
    i = end;
  };
  while (i < text.length) {
    if (text.startsWith('--', i)) {
      const end = text.indexOf('\n', i);
      hide(end < 0 ? text.length : end);
    } else if (text.startsWith('/*', i)) {
      let depth = 1, end = i + 2;
      while (end < text.length && depth) {
        if (text.startsWith('/*', end)) { depth++; end += 2; }
        else if (text.startsWith('*/', end)) { depth--; end += 2; }
        else end++;
      }
      hide(end);
    } else if (['\'', '"', '`', '['].includes(text[i]!)) {
      const quote = text[i] === '[' ? ']' : text[i];
      let end = i + 1;
      // E'...' is PostgreSQL's explicit backslash-escaped string form.
      const escaped = text[i] === '\'' && /(?:^|\W)[eE]$/.test(text.slice(Math.max(0, i - 2), i));
      while (end < text.length) {
        if (escaped && text[end] === '\\') { end = Math.min(text.length, end + 2); continue; }
        if (text[end++] === quote) {
          if (quote !== ']' && text[end] === quote) { end++; continue; }
          break;
        }
      }
      hide(end);
    } else {
      const dollar = text[i] === '$' ? text.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/)?.[0] : undefined;
      if (dollar) {
        const end = text.indexOf(dollar, i + dollar.length);
        hide(end < 0 ? text.length : end + dollar.length);
      } else output += text[i++];
    }
  }
  return output;
}

function extract(input: ContextInput): EditorContext {
  // Composite identifiers tokenize into misleading natural-language aliases.
  // Keep callable SQL names, but hide bare names such as recursive_cte.
  const masked = maskSql(input.text).replace(/\b[A-Za-z][A-Za-z0-9_$]*_[A-Za-z0-9_$]*\b/g, (name, index, text: string) =>
    /^\s*\(/.test(text.slice(index + name.length)) ? name : ' '.repeat(name.length));
  const offset = Math.max(0, Math.min(input.offset, masked.length));
  // A previous query must not outweigh the statement being edited.
  const start = offset ? masked.lastIndexOf(';', offset - 1) + 1 : 0;
  const next = masked.indexOf(';', offset);
  const end = next < 0 ? masked.length : next;
  const lineStart = Math.max(start, masked.lastIndexOf('\n', offset - 1) + 1);
  const nextLine = masked.indexOf('\n', offset);
  const lineEnd = Math.min(end, nextLine < 0 ? masked.length : nextLine);
  const currentLine = masked.slice(lineStart, lineEnd).slice(0, 800);
  const frame = /\b(?:ROWS|RANGE|GROUPS)\s+BETWEEN\b[^)\n]*/i.exec(currentLine);
  const inFrame = frame && offset - lineStart >= frame.index - 1 && offset - lineStart <= frame.index + frame[0].length;
  const focus = inFrame ? frame[0] : currentLine;
  return { languageId: 'sql', scope: 'block', currentLine: focus, focus,
    local: masked.slice(Math.max(start, offset - 1400), Math.min(end, offset + 600)),
    imports: '', symbols: '', recentEdits: '', cues: [] };
}

export const sqlAdapter: LanguageAdapter = { languageId: 'sql', extract };

/** Pin identity stays `sql`; only browsable/retrievable content changes dialect. */
export function sqlPackForDialect(pack: ReferencePack, dialect: SqlDialect): ReferencePack {
  const referenceTopics = pack.referenceTopics?.filter(t => !t.dialects || t.dialects.includes(dialect));
  const topics = new Set(referenceTopics?.map(t => t.id) ?? pack.concepts.map(c => c.id));
  return { ...pack, displayName: `SQL (${dialect === 'sqlite' ? 'SQLite' : 'PostgreSQL'})`, referenceTopics,
    concepts: pack.concepts.filter(c => topics.has(c.id)),
    cards: pack.cards.filter(c => (!c.dialects || c.dialects.includes(dialect)) && c.topics.every(t => topics.has(t))),
    referenceGroups: pack.referenceGroups?.map(g => ({ ...g, topics: g.topics.filter(t => topics.has(t)) })).filter(g => g.topics.length) };
}
