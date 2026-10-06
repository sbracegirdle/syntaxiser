import { ReferencePack } from './types';

const scopes = new Set(['module', 'function', 'type', 'trait', 'implementation', 'block']);

export function validatePack(value: unknown): ReferencePack {
  if (!value || typeof value !== 'object') throw new Error('Reference pack must be an object');
  const p = value as ReferencePack;
  if (p.schemaVersion !== 1 || typeof p.languageId !== 'string' || typeof p.displayName !== 'string'
      || !Array.isArray(p.concepts) || !Array.isArray(p.cards) || !p.cards.length) {
    throw new Error('Invalid reference pack header');
  }
  const topics = new Set<string>();
  for (const c of p.concepts) {
    if (typeof c.id !== 'string' || topics.has(c.id) || !strings(c.aliases) || !strings(c.patterns)) {
      throw new Error('Invalid or duplicate concept');
    }
    for (const pattern of c.patterns) new RegExp(pattern, 'i');
    topics.add(c.id);
  }
  const ids = new Set<string>();
  for (const c of p.cards) {
    if (typeof c.id !== 'string' || ids.has(c.id) || typeof c.title !== 'string' || typeof c.code !== 'string'
        || (c.explanation !== undefined && (typeof c.explanation !== 'string' || !c.explanation.trim()))
        || !c.code.trim() || !strings(c.topics) || !c.topics.length || !c.topics.every(t => topics.has(t))
        || !strings(c.scopes) || !c.scopes.length || !c.scopes.every(s => scopes.has(s))
        || !strings(c.keywords) || !Number.isFinite(c.priority) || c.priority < 0 || c.priority > 1) {
      throw new Error(`Invalid reference card: ${c.id}`);
    }
    ids.add(c.id);
  }
  return p;
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(x => typeof x === 'string');
}
