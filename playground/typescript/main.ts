// Open this file in VS Code with Syntaxiser visible.
// Move between the sections, search the suggested phrases, and browse Reference.
import type { Result, User } from './models';

// Generics retain the element type. Search "generic" or "first item".
function first<T>(values: readonly T[]): T | undefined {
  return values[0];
}

// Optional chaining and nullish defaults. Search "handle missing value".
function displayName(user: User | undefined): string {
  return user?.name ?? 'Anonymous';
}

// Narrow unknown input before using it. Search "type guard".
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null
    && 'id' in value && typeof value.id === 'string'
    && 'role' in value && (value.role === 'author' || value.role === 'reviewer')
    && (!('name' in value) || value.name === undefined || typeof value.name === 'string');
}

// Utility types describe a partial update. Search "partial update".
type UserPatch = Partial<Omit<User, 'id'>>;
function updateUser(user: User, patch: UserPatch): User {
  return { ...user, ...patch };
}

// A class encapsulates mutable state. Browse Classes in Reference.
class Counter {
  private value = 0;

  increment(): number {
    this.value += 1;
    return this.value;
  }
}

// Const assertions preserve paths while satisfies checks their shape.
const routes = {
  home: '/',
  users: '/users',
} as const satisfies Record<string, `/${string}`>;

// Async work uses local promises; this playground makes no network requests.
async function loadUsers(): Promise<Result<User[]>> {
  try {
    const raw: unknown = await Promise.resolve([
      { id: 'u1', name: 'Ada', role: 'author' },
      { id: 'u2', role: 'reviewer' },
      { id: 'u3', name: 'Grace', role: 'author' },
    ]);
    if (!Array.isArray(raw) || !raw.every(isUser)) {
      throw new TypeError('Invalid users');
    }
    return { status: 'ok', value: raw };
  } catch (error: unknown) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

async function main(): Promise<void> {
  // Discriminated unions narrow by status. Browse Unions and Narrowing.
  const result = await loadUsers();
  if (result.status === 'error') {
    console.log(result.message);
    return;
  }

  const users = result.value;
  console.log('first user:', displayName(first(users)));

  // Collection callbacks. Search "transform collection".
  const authors = users
    .filter(user => user.role === 'author')
    .map(user => displayName(user));
  console.log('authors:', authors.join(', '));

  // Maps, loops, and missing entries. Search "key value lookup".
  const counts = new Map<User['role'], number>();
  for (const user of users) {
    counts.set(user.role, (counts.get(user.role) ?? 0) + 1);
  }
  console.log('role counts:', [...counts]);

  const original = first(users);
  if (original) {
    const updated = updateUser(original, { name: 'Ada Lovelace' });
    const { id, ...profile } = updated;
    console.log('updated profile:', id, profile);
  }

  const uniqueRoles = [...new Set(users.map(user => user.role))];
  const summary: [users: number, roles: number] = [users.length, uniqueRoles.length];
  const counter = new Counter();
  console.log('summary:', summary, 'visit:', counter.increment(), 'route:', routes.users);
}

void main();
