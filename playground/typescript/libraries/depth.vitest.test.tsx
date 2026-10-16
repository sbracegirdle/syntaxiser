// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readName } from './.catalog-depth/ts-conditional-result.js';
import { batch } from './.catalog-depth/ts-conditional-batch.js';
import { nameEvents } from './.catalog-depth/ts-template-events.js';
import { routeLabel } from './.catalog-depth/ts-template-route.js';
import { getters, person } from './.catalog-depth/ts-mapped-getters.js';
import { publicUser } from './.catalog-depth/ts-mapped-public.js';
import { makeDate } from './.catalog-depth/ts-overload-date.js';
import { labels } from './.catalog-depth/ts-overload-format.js';
import { userName } from './.catalog-depth/ts-assert-user.js';
import { portOrDefault } from './.catalog-depth/ts-assert-port.js';
import { loadLabel, type Load } from './.catalog-depth/ts-exhaustive-load.js';
import { update } from './.catalog-depth/ts-exhaustive-command.js';
import { sortedNames } from './.catalog-depth/ts-readonly-sort.js';
import { clamp } from './.catalog-depth/ts-readonly-tuple.js';
import { pluck } from './.catalog-depth/ts-constrained-pluck.js';
import { collectNames, visitDogs } from './.catalog-depth/ts-variance-consumer.js';
import { summarize } from './.catalog-depth/ts-promise-settled.js';
import { ownedBatch } from './.catalog-depth/ts-promise-owned.js';
import { NameForm, reducer, initial } from './.catalog-depth/ts-react-reducer.js';
import { Draft, history } from './.catalog-depth/ts-react-history.js';
import { ThemeProvider, ThemeButton } from './.catalog-depth/ts-react-context.js';
import { StatusProvider, Status, type StatusSource } from './.catalog-depth/ts-react-subscription.js';
import { validateProfile } from './.catalog-depth/ts-zod-errors.js';
import { validateRange } from './.catalog-depth/ts-zod-cross-field.js';
import { Items } from './.catalog-depth/ts-query-transitions.js';
import { CachedItems } from './.catalog-depth/ts-query-refresh.js';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('conditional result: validated success, trimmed boundary, rejected unknown and empty batch', () => {
  expect(readName('Ada')).toEqual({ ok: true, data: { name: 'Ada' } });
  expect(readName(' Ada ')).toEqual({ ok: true, data: { name: 'Ada' } });
  for (const invalid of ['', '  ', null, 7, {}]) expect(readName(invalid)).toEqual({ ok: false, error: 'Name required' });
  expect(batch<string | number>('Ada', 2)).toEqual(['Ada', 2]);
  expect(batch()).toEqual([]);
});
test('template events: delivery, idempotent unsubscribe, empty names and finite routes', () => {
  const bus = nameEvents(), listener = vi.fn();
  bus.rename('unobserved'); expect(listener).not.toHaveBeenCalled();
  const stop = bus.on('nameChanged', listener);
  bus.rename('Ada'); bus.rename('');
  expect(listener.mock.calls).toEqual([['Ada'], ['']]);
  stop(); stop(); bus.rename('ignored'); expect(listener).toHaveBeenCalledTimes(2);
  expect(() => bus.on('bad' as 'nameChanged', listener)).toThrow('Unknown event');
  expect(routeLabel('/users/list')).toBe('People'); expect(routeLabel('/teams/new')).toBe('Create team');
});
test('key remapping: getters stay live and public projection removes runtime secrets', () => {
  expect(getters.getName()).toBe('Ada'); expect(getters.getAge()).toBe(37);
  const old = person.name;
  try { person.name = ''; expect(getters.getName()).toBe(''); } finally { person.name = old; }
  expect(publicUser({ id: '1', name: '', _token: 'private' })).toEqual({ id: '1', name: '' });
  expect(JSON.stringify(publicUser({ id: '1', name: 'Ada', _token: 'private' }))).not.toContain('private');
});
test('overloads: UTC timestamp/parts, normalized boundary, invalid timestamps and nonfinite formatting', () => {
  expect(makeDate(0).toISOString()).toBe('1970-01-01T00:00:00.000Z');
  expect(makeDate(2026, 10, 16).toISOString()).toBe('2026-10-16T00:00:00.000Z');
  expect(makeDate(2026, 2, 30).toISOString()).toBe('2026-03-02T00:00:00.000Z');
  expect(() => makeDate(NaN)).toThrow('Invalid date');
  expect(labels(1)).toBe('1.00'); expect(labels([1, 2])).toEqual(['1.00', '2.00']); expect(labels([])).toEqual([]);
  expect(() => labels([Infinity])).toThrow('Finite number required');
});
test('assertions: valid data, allowed extra properties/defaults/bounds and rejection', () => {
  expect(userName({ name: ' Ada ', extra: true })).toBe('Ada');
  for (const value of [null, {}, { name: 7 }, { name: ' ' }]) expect(() => userName(value)).toThrow('Invalid user');
  expect(portOrDefault(undefined)).toBe(3000); expect(portOrDefault(1)).toBe(1); expect(portOrDefault(65535)).toBe(65535);
  for (const value of [0, 65536, 1.5, '80', null]) expect(() => portOrDefault(value)).toThrow(RangeError);
});
test('exhaustive handling: every known state, empty result and invalid runtime state', () => {
  expect(loadLabel({ kind: 'pending' })).toBe('Loading'); expect(loadLabel({ kind: 'ready', count: 0 })).toBe('0 results');
  expect(loadLabel({ kind: 'ready', count: 2 })).toBe('2 results'); expect(loadLabel({ kind: 'failed', message: 'offline' })).toBe('Retry: offline');
  // Deliberately simulate corrupt external data to verify the runtime boundary.
  expect(() => loadLabel({ kind: 'unknown' } as unknown as Load)).toThrow('Unknown load state');
  expect(update(2, { kind: 'add', amount: 3 })).toBe(5); expect(update(2, { kind: 'add', amount: 0 })).toBe(2);
  expect(update(2, { kind: 'reset' })).toBe(0); expect(() => update(2, { kind: 'add', amount: NaN })).toThrow(RangeError);
});
test('readonly boundaries: sorting preserves source, empty copy and clamping rejection', () => {
  const source = Object.freeze(['Ben', 'Ada']); expect(sortedNames(source)).toEqual(['Ada', 'Ben']); expect(source).toEqual(['Ben', 'Ada']);
  const empty: string[] = []; expect(sortedNames(empty)).toEqual([]); expect(sortedNames(empty)).not.toBe(empty);
  expect(clamp(50, [0, 100])).toBe(50); expect(clamp(-1, [0, 100])).toBe(0); expect(clamp(8, [4, 4])).toBe(4);
  expect(() => clamp(1, [2, 0])).toThrow(RangeError); expect(() => clamp(NaN, [0, 1])).toThrow(RangeError);
});
test('generic read and variance: specific results, empty input and safe broad consumer', () => {
  expect(pluck([{ age: 3 }, { age: 5 }], 'age')).toEqual([3, 5]); expect(pluck<{ age: number }, 'age'>([], 'age')).toEqual([]);
  const names: string[] = [], consume = collectNames(names);
  visitDogs([{ name: 'Rex', bark() {} }], consume); expect(names).toEqual(['Rex']);
  visitDogs([], consume); expect(names).toEqual(['Rex']);
  expect(() => visitDogs([{ name: 'Rex', bark() {} }], () => { throw new Error('Consumer failed'); })).toThrow('Consumer failed');
});
test('promise allSettled: input order, empty batch and actual rejected branches', async () => {
  expect(await summarize([Promise.resolve('a'), Promise.resolve('b')])).toEqual({ values: ['a', 'b'], errors: [] });
  expect(await summarize([])).toEqual({ values: [], errors: [] });
  expect(await summarize([Promise.reject('offline'), Promise.resolve('b')])).toEqual({ values: ['b'], errors: ['offline'] });
});
test('promise all ownership: success, empty batch, sync throw, sibling abort and observed failures', async () => {
  expect(await ownedBatch([async () => 'a', async () => 'b'])).toEqual(['a', 'b']); expect(await ownedBatch([])).toEqual([]);
  const original = new Error('offline'), released = vi.fn();
  const sibling = (signal: AbortSignal) => new Promise<string>((resolve, reject) => {
    const stop = () => { released(); reject(new Error('cancelled sibling')); };
    if (signal.aborted) stop(); else signal.addEventListener('abort', stop, { once: true });
  });
  await expect(ownedBatch([() => { throw original; }, sibling])).rejects.toBe(original);
  expect(released).toHaveBeenCalledTimes(1);
});
test('React reducer form: reject blank, save normalized data, edit and reset', async () => {
  const user = userEvent.setup(); render(<NameForm />);
  await user.click(screen.getByRole('button', { name: 'Save' })); expect(screen.getByRole('status').textContent).toBe('Name required');
  await user.type(screen.getByRole('textbox', { name: 'Name' }), ' Ada ');
  await user.click(screen.getByRole('button', { name: 'Save' })); expect(screen.getByRole('status').textContent).toBe('Ada');
  await user.click(screen.getByRole('button', { name: 'Reset' })); expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  expect(reducer(initial, { type: 'submit' }).error).toBe('Name required'); expect(initial.error).toBe('');
});
test('React history: undo interaction, empty boundary and duplicate no-op', async () => {
  const user = userEvent.setup(); const view = render(<Draft />);
  expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  await user.type(screen.getByRole('textbox'), 'ab'); await user.click(screen.getByRole('button'));
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('a');
  const state = { current: 'a', past: [] }; expect(history(state, { type: 'undo' })).toBe(state); expect(history(state, { type: 'edit', text: 'a' })).toBe(state);
  view.unmount();
});
test('React context: state toggle, provider isolation and missing-provider rejection', async () => {
  const user = userEvent.setup(); render(<><ThemeProvider><ThemeButton /></ThemeProvider><ThemeProvider><ThemeButton /></ThemeProvider></>);
  await user.click(screen.getAllByRole('button')[0]!); expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual(['dark', 'light']);
  cleanup(); vi.spyOn(console, 'error').mockImplementation(() => {}); expect(() => render(<ThemeButton />)).toThrow('ThemeProvider required');
});
function statusSource() {
  const listeners = new Set<(value: string) => void>();
  const source: StatusSource = { subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; } };
  return { source, size: () => listeners.size, send(value: string) { listeners.forEach(listener => listener(value)); } };
}
test('React subscription: StrictMode replay, source replacement, unmount and stale-source recovery', () => {
  const first = statusSource(), second = statusSource();
  const ui = (source: StatusSource) => <StrictMode><StatusProvider source={source}><Status /></StatusProvider></StrictMode>;
  const view = render(ui(first.source)); expect(first.size()).toBe(1); expect(screen.getByRole('status').textContent).toBe('waiting');
  act(() => first.send('ready')); expect(screen.getByRole('status').textContent).toBe('ready');
  view.rerender(ui(second.source)); expect(first.size()).toBe(0); expect(second.size()).toBe(1); expect(screen.getByRole('status').textContent).toBe('waiting');
  act(() => first.send('stale')); expect(screen.getByRole('status').textContent).toBe('waiting');
  act(() => second.send('recovered')); expect(screen.getByRole('status').textContent).toBe('recovered');
  view.unmount(); expect(second.size()).toBe(0);
  vi.spyOn(console, 'error').mockImplementation(() => {}); expect(() => render(<Status />)).toThrow('StatusProvider required');
});
test('Zod issue reporting: normalization, zero/equal boundaries and actionable error paths', () => {
  expect(validateProfile({ name: ' Ada ', age: 0, ignored: true })).toEqual({ ok: true, data: { name: 'Ada', age: 0 } });
  const invalid = validateProfile({ name: '', age: -1 }); expect(invalid.ok).toBe(false);
  if (!invalid.ok) expect(invalid.issues.map(i => i.field)).toEqual(['name', 'age']);
  expect(validateProfile(null).ok).toBe(false); expect(validateProfile({ name: 'Ada' }).ok).toBe(false);
  expect(validateRange({ start: 1, end: 2 }).success).toBe(true); expect(validateRange({ start: 1, end: 1 }).success).toBe(true);
  const reversed = validateRange({ start: 2, end: 1 }); expect(reversed.success).toBe(false);
  if (!reversed.success) expect(reversed.error.issues[0]).toMatchObject({ path: ['end'], code: 'custom' });
  expect(validateRange({ start: NaN, end: 2 }).success).toBe(false);
});
function client() { return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); }
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
test('Query transitions: pending, failure, explicit retry and empty success', async () => {
  const cache = client(), first = deferred<string[]>(), load = vi.fn().mockImplementationOnce(() => first.promise).mockResolvedValueOnce([]);
  try {
    render(<QueryClientProvider client={cache}><Items load={load} /></QueryClientProvider>);
    expect(screen.getByRole('status').textContent).toBe('Loading'); first.reject(new Error('offline'));
    await screen.findByRole('button', { name: 'Retry' }); await userEvent.setup().click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('No items')); expect(load).toHaveBeenCalledTimes(2);
  } finally { cleanup(); cache.clear(); }
});
test('Query refresh: retained data during pending and failed refresh, then recovery', async () => {
  const cache = client(), refresh = deferred<string[]>();
  const load = vi.fn().mockResolvedValueOnce(['Ada']).mockImplementationOnce(() => refresh.promise).mockResolvedValueOnce([]);
  try {
    render(<QueryClientProvider client={cache}><CachedItems load={load} /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('1 cached items'));
    await userEvent.setup().click(screen.getByRole('button')); await waitFor(() => expect(screen.getByRole('status').textContent).toContain('refreshing'));
    refresh.reject(new Error('offline')); await screen.findByRole('alert'); expect(screen.getByRole('status').textContent).toBe('1 cached items');
    await userEvent.setup().click(screen.getByRole('button')); await waitFor(() => expect(screen.getByRole('status').textContent).toBe('0 cached items'));
    expect(screen.queryByRole('alert')).toBeNull();
  } finally { cleanup(); cache.clear(); }
});
test('Query unmount aborts the consumed request signal and releases the loader', async () => {
  const cache = client(), stopped = vi.fn();
  const load = (signal: AbortSignal) => new Promise<string[]>((resolve, reject) => signal.addEventListener('abort', () => { stopped(); reject(new Error('aborted')); }, { once: true }));
  try {
    const view = render(<QueryClientProvider client={cache}><Items load={load} /></QueryClientProvider>);
    view.unmount(); expect(stopped).toHaveBeenCalledTimes(1);
  } finally { cache.clear(); }
});
