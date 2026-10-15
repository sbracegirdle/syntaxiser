import { once } from 'node:events';
import { test, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Counter, vueTotal, angularTotal, angularConfig, nextSearch, User, app,
  axiosUsers, taskGroups, dueDate, doubledEvens, queryClient, loadTodos, TodoApp, vanillaCounter,
} from './demo.js';

test('UI and reactive library examples produce their expected values', () => {
  expect(renderToStaticMarkup(<Counter label="Visits" />)).toBe('<button>Visits: 0</button>');
  expect(vueTotal()).toBe(5);
  expect(angularTotal()).toBe(45);
  expect(angularConfig()).toBe('/api');
});

test('Next.js, Zod, and Axios examples handle typed data without external services', async () => {
  const response = nextSearch(new Request('https://example.invalid/?q=%20hello%20'));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ query: 'hello' });
  expect(User.parse({ name: ' Ada ' })).toEqual({ name: 'Ada' });
  expect(User.safeParse({ name: '' }).success).toBe(false);
  expect(await axiosUsers()).toEqual([{ id: 'u1', name: 'Ada' }]);
});

test('Express route rejects invalid JSON data and accepts a valid user', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected loopback listener');
    const url = `http://127.0.0.1:${address.port}/users`;
    const send = (body: unknown) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const valid = await send({ name: ' Ada ' });
    expect(valid.status).toBe(201);
    expect(await valid.json()).toEqual({ name: 'Ada' });
    const invalid = await send({ name: 7 });
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ error: 'Invalid name' });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('utility and stream examples return deduplicated groups, dates, and transformed values', async () => {
  expect(taskGroups()).toEqual({ open: [{ id: 't1', status: 'open' }], done: [{ id: 't2', status: 'done' }] });
  expect(dueDate()).toBe('2026-10-22');
  expect(await doubledEvens()).toEqual([4, 8]);
});

test('TanStack Query caches typed data and provides it to a React component', async () => {
  const load = vi.fn(loadTodos);
  try {
    const options = { queryKey: ['todos'], queryFn: load, staleTime: Infinity };
    await queryClient.fetchQuery(options);
    await queryClient.fetchQuery(options);
    expect(load).toHaveBeenCalledTimes(1);
    expect(renderToStaticMarkup(<TodoApp />)).toBe('<p>1 todos</p>');
  } finally { queryClient.clear(); }
});

test('Zustand subscription observes an update and can be stopped', () => {
  vanillaCounter.setState({ count: 0 });
  const listener = vi.fn();
  const stop = vanillaCounter.subscribe(listener);
  vanillaCounter.setState({ count: 1 });
  stop();
  vanillaCounter.setState({ count: 2 });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener.mock.calls[0]?.[0]).toEqual({ count: 1 });
});
