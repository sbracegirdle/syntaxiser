import { randomUUID } from 'node:crypto';
import { builtinLessons } from '../lessons/catalog';

export type LessonStatus = 'untracked' | 'todo' | 'in-progress' | 'done' | 'hidden';
export interface Lesson {
  id: string;
  title: string;
  difficulty: number;
  instructions: string;
  starter: string;
  check: string;
}
export interface TrackedLesson extends Lesson { status: LessonStatus; custom: boolean }
export interface LessonLibrary { languageId: string; language: string; lessons: TrackedLesson[] }
export type LessonAction =
  | { action: 'status'; languageId: string; id: string; status: LessonStatus }
  | { action: 'save'; languageId: string; id?: string; lesson: Omit<Lesson, 'id'> }
  | { action: 'delete'; languageId: string; id: string }
  | { action: 'reset'; languageId: string; all: boolean };

const statuses = new Set(['untracked', 'todo', 'in-progress', 'done', 'hidden']);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max: number, required = false): value is string =>
  typeof value === 'string' && value.length <= max && (!required || !!value.trim());
function validLesson(value: unknown): value is Omit<Lesson, 'id'> {
  return record(value) && text(value.title, 120, true) && text(value.instructions, 6000, true)
    && text(value.starter, 12000) && text(value.check, 3000)
    && typeof value.difficulty === 'number' && Number.isInteger(value.difficulty) && value.difficulty >= 1 && value.difficulty <= 5;
}

// Both messages and persisted data are untrusted. Keep bounds at the host boundary.
export function parseLessonAction(value: unknown): LessonAction | undefined {
  if (!record(value) || !text(value.languageId, 100, true)) return;
  const languageId = value.languageId;
  if (value.action === 'status' && text(value.id, 200, true) && typeof value.status === 'string' && statuses.has(value.status))
    return { action: 'status', languageId, id: value.id, status: value.status as LessonStatus };
  if (value.action === 'save' && (value.id === undefined || text(value.id, 200, true)) && validLesson(value.lesson))
    return { action: 'save', languageId, id: value.id, lesson: value.lesson };
  if (value.action === 'delete' && text(value.id, 200, true)) return { action: 'delete', languageId, id: value.id };
  if (value.action === 'reset' && typeof value.all === 'boolean') return { action: 'reset', languageId, all: value.all };
}

interface SavedLanguage { custom: Lesson[]; statuses: Record<string, LessonStatus> }
export class LessonStore {
  private readonly saved = new Map<string, SavedLanguage>();
  constructor(private readonly languages: { languageId: string; displayName: string }[], raw?: unknown) {
    for (const language of languages) {
      const data = record(raw) && raw.version === 1 && record(raw.languages) ? raw.languages[language.languageId] : undefined;
      const custom: Lesson[] = [];
      if (record(data) && Array.isArray(data.custom)) for (const item of data.custom.slice(0, 200)) {
        const id: unknown = record(item) ? item.id : undefined;
        if (!text(id, 200, true) || !id.startsWith('custom-') || !validLesson(item)
          || custom.some(lesson => lesson.id === id)) continue;
        custom.push(this.clean(id, item));
      }
      const ids = new Set([...(builtinLessons[language.languageId] ?? []), ...custom].map(lesson => lesson.id));
      const progress: Record<string, LessonStatus> = Object.create(null);
      if (record(data) && record(data.statuses)) for (const [id, status] of Object.entries(data.statuses)) {
        if (ids.has(id) && typeof status === 'string' && statuses.has(status) && status !== 'untracked') progress[id] = status as LessonStatus;
      }
      this.saved.set(language.languageId, { custom, statuses: progress });
    }
  }
  libraries(): LessonLibrary[] {
    return this.languages.map(language => {
      const data = this.saved.get(language.languageId)!;
      return { languageId: language.languageId, language: language.displayName,
        lessons: [...(builtinLessons[language.languageId] ?? []).map(lesson => ({ ...lesson, custom: false })),
          ...data.custom.map(lesson => ({ ...lesson, custom: true }))]
          .map(lesson => ({ ...lesson, status: data.statuses[lesson.id] ?? 'untracked' })) };
    });
  }
  apply(action: Exclude<LessonAction, { action: 'reset' }>): boolean {
    const data = this.saved.get(action.languageId);
    if (!data) return false;
    const builtins = builtinLessons[action.languageId] ?? [];
    if (action.action === 'save') {
      const index = action.id ? data.custom.findIndex(lesson => lesson.id === action.id) : -1;
      if (action.id && index < 0 || !action.id && data.custom.length >= 200) return false;
      const lesson = this.clean(action.id ?? `custom-${randomUUID()}`, action.lesson);
      if (index >= 0) data.custom[index] = lesson;
      else {
        data.custom.push(lesson);
        data.statuses[lesson.id] = 'todo';
      }
    } else if (action.action === 'delete') {
      const index = data.custom.findIndex(lesson => lesson.id === action.id);
      if (index < 0) return false;
      data.custom.splice(index, 1);
      delete data.statuses[action.id];
    } else {
      if (![...builtins, ...data.custom].some(lesson => lesson.id === action.id)) return false;
      if (action.status === 'untracked') delete data.statuses[action.id];
      else data.statuses[action.id] = action.status;
    }
    return true;
  }
  reset(languageId: string, all: boolean, removeCustom: boolean): void {
    for (const [id, data] of this.saved) if (all || id === languageId) {
      data.statuses = Object.create(null);
      if (removeCustom) data.custom = [];
    }
  }
  serialize(): unknown {
    // Snapshot queued writes so later mutations cannot change an earlier save.
    return JSON.parse(JSON.stringify({ version: 1, languages: Object.fromEntries(this.saved) }));
  }
  private clean(id: string, lesson: Omit<Lesson, 'id'>): Lesson {
    return { id, title: lesson.title.trim(), difficulty: lesson.difficulty, instructions: lesson.instructions.trim(),
      starter: lesson.starter, check: lesson.check.trim() };
  }
}
