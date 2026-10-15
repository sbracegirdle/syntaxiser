export type Scope = 'module' | 'function' | 'type' | 'trait' | 'implementation' | 'block';
export type SqlDialect = 'sqlite' | 'postgresql';

export interface ReferenceCard {
  dialects?: SqlDialect[];
  id: string;
  title: string;
  code: string;
  /** Overrides code highlighting for manifest recipes within a language pack. */
  languageId?: 'toml';
  explanation?: string;
  topics: string[];
  scopes: Scope[];
  keywords: string[];
  priority: number;
}

export interface Concept {
  id: string;
  aliases: string[];
  patterns: string[];
}

export interface ReferenceGroup {
  id: string;
  title: string;
  topics: string[];
}

export interface TopicOverview {
  dialects?: SqlDialect[];
  id: string;
  title: string;
  summary: string;
  syntax: string;
  languageId?: 'toml';
  rules: string[];
  references?: LearningReference[];
}

export interface LearningReference {
  title: string;
  url: string;
}

export interface ReferencePack {
  schemaVersion: 1;
  languageId: string;
  displayName: string;
  concepts: Concept[];
  referenceGroups?: ReferenceGroup[];
  referenceTopics?: TopicOverview[];
  cards: ReferenceCard[];
}

export interface SymbolContext {
  name: string;
  kind: number;
  start: number;
  end: number;
}

export interface ContextInput {
  filePath?: string;
  text: string;
  offset: number;
  symbols: SymbolContext[];
  recentEdits: string[];
}

export interface EditorContext {
  /** Schema-specific adapters can exclude unrelated topic families from context. */
  topicPrefixes?: string[];
  languageId: string;
  scope: Scope;
  local: string;
  currentLine: string;
  focus?: string;
  imports: string;
  symbols: string;
  recentEdits: string;
  cues: string[];
}

export interface LanguageAdapter {
  languageId: string;
  aliases?: string[];
  extract(input: ContextInput): EditorContext;
}

export interface RankedCard {
  card: ReferenceCard;
  score: number;
}
