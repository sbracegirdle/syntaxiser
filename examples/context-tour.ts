// Move the cursor between imports, declarations, collection work, and async code.
import type { ReferencePack } from '../src/core/types';

interface User {
  readonly id: string;
  name?: string;
}

function displayName(user: User | undefined): string {
  return user?.name ?? 'Anonymous';
}

function labelCounts(labels: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const label of labels) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return counts;
}

async function loadUsers(load: () => Promise<User[]>): Promise<string[]> {
  try {
    const users = await load();
    return users.map(displayName);
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

const routes = { home: '/', settings: '/settings' } as const satisfies Record<string, `/${string}`>;
type LanguageId = ReferencePack['languageId'];
const language: LanguageId = 'typescript';
void [displayName, labelCounts, loadUsers, routes, language];
