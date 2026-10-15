// Move here to test interface, readonly, optional property, and union suggestions.
export interface User {
  readonly id: string;
  name?: string;
  role: 'author' | 'reviewer';
}

export type Result<T> =
  | { status: 'ok'; value: T }
  | { status: 'error'; message: string };
