export type Scope = 'module' | 'function' | 'type' | 'trait' | 'implementation' | 'block';

export interface ReferenceCard {
  id: string;
  title: string;
  code: string;
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

export interface ReferencePack {
  schemaVersion: 1;
  languageId: string;
  displayName: string;
  concepts: Concept[];
  cards: ReferenceCard[];
}

export interface SymbolContext {
  name: string;
  kind: number;
  start: number;
  end: number;
}

export interface ContextInput {
  text: string;
  offset: number;
  symbols: SymbolContext[];
  recentEdits: string[];
}

export interface EditorContext {
  languageId: string;
  scope: Scope;
  local: string;
  currentLine: string;
  imports: string;
  symbols: string;
  recentEdits: string;
  cues: string[];
}

export interface LanguageAdapter {
  languageId: string;
  extract(input: ContextInput): EditorContext;
}

export interface RankedCard {
  card: ReferenceCard;
  score: number;
}
