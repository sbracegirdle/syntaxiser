import { ReferencePack } from './core/types';

// Keep host-language clients in their own catalogs, separate from SQL results.
const companions: Record<string, Pick<ReferencePack, 'concepts' | 'cards' | 'referenceTopics' | 'referenceGroups'>> =
  require('../packs/sql-companions.json');

export function withSqlCompanions(pack: ReferencePack): ReferencePack {
  const extra = companions[pack.languageId];
  if (!extra) return pack;
  return { ...pack, concepts: [...pack.concepts, ...extra.concepts], cards: [...pack.cards, ...extra.cards],
    referenceTopics: [...(pack.referenceTopics ?? []), ...(extra.referenceTopics ?? [])],
    referenceGroups: [...(pack.referenceGroups ?? []), ...(extra.referenceGroups ?? [])] };
}
