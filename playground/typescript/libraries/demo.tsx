// Open this file in Syntaxiser and move between the imports and library calls.
import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ref, computed as vueComputed } from 'vue';
import { signal, computed, InjectionToken, Injector, inject, runInInjectionContext } from '@angular/core';
import nextServer from 'next/server.js';
import express from 'express';
import { z } from 'zod';
import axios from 'axios';
import lodash from 'lodash';
import { parseISO, addDays, format } from 'date-fns';
import { of, filter, map, toArray, firstValueFrom } from 'rxjs';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';

// React .tsx props/state. Server rendering exercises the component without a browser.
export function Counter({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(value => value + 1)}>{label}: {count}</button>;
}

// Vue .ts/TSX Composition API; .vue files have a separate editor language ID.
export function vueTotal(): number {
  const quantities = ref([2, 3]);
  const total = vueComputed(() => quantities.value.reduce((sum, value) => sum + value, 0));
  return total.value;
}

// Angular core signals and an explicit injection context; no Angular template compiler.
export function angularTotal(): number {
  const price = signal(15);
  const count = signal(2);
  const total = computed(() => price() * count());
  count.update(value => value + 1);
  return total();
}

export function angularConfig(): string {
  const ApiBase = new InjectionToken<string>('ApiBase');
  const injector = Injector.create({ providers: [{ provide: ApiBase, useValue: '/api' }] });
  try { return runInInjectionContext(injector, () => inject(ApiBase)); }
  finally { injector.destroy(); }
}

// Next.js App Router handler logic, runnable with an ordinary Request in Node.
// In a Next project use `import { NextResponse } from 'next/server'` in route.ts.
export function nextSearch(request: Request): Response {
  const query = new URL(request.url).searchParams.get('q') ?? '';
  return nextServer.NextResponse.json({ query: query.trim() });
}

// Express registers handlers here; only the tests start a loopback listener.
export const User = z.object({ name: z.string().trim().min(1) });
export const app = express();
app.use(express.json());
app.post('/users', (request, response) => {
  const parsed = User.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ error: 'Invalid name' }); return; }
  response.status(201).json(parsed.data);
});

// Axios uses a local adapter instead of making an external request.
export const client = axios.create({
  adapter: async config => ({
    config, data: [{ id: 'u1', name: 'Ada' }], status: 200, statusText: 'OK', headers: {},
  }),
});
export async function axiosUsers(): Promise<{ id: string; name: string }[]> {
  return (await client.get<{ id: string; name: string }[]>('/users')).data;
}

// Native Node ESM consumes the CommonJS lodash package through its default export.
export function taskGroups() {
  const tasks = [{ id: 't1', status: 'open' }, { id: 't1', status: 'open' }, { id: 't2', status: 'done' }];
  return lodash.groupBy(lodash.uniqBy(tasks, task => task.id), task => task.status);
}

export function dueDate(): string {
  return format(addDays(parseISO('2026-10-15'), 7), 'yyyy-MM-dd');
}

export function doubledEvens(): Promise<number[]> {
  return firstValueFrom(of(1, 2, 3, 4).pipe(filter(value => value % 2 === 0), map(value => value * 2), toArray()));
}

// TanStack Query 5 uses a typed loader and cache; the demo has no remote service.
export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
export async function loadTodos(): Promise<{ id: string }[]> { return [{ id: 't1' }]; }
export function Todos() {
  const query = useQuery({ queryKey: ['todos'], queryFn: loadTodos, staleTime: Infinity });
  return <p>{query.data?.length ?? 0} todos</p>;
}
export function TodoApp() {
  return <QueryClientProvider client={queryClient}><Todos /></QueryClientProvider>;
}

// Zustand 5 React selectors and vanilla subscriptions share typed state APIs.
export const useCounter = create<{ count: number; increment: () => void }>()(set => ({
  count: 0, increment: () => set(state => ({ count: state.count + 1 })),
}));
export function SharedCounter() {
  const count = useCounter(state => state.count);
  return <p>{count}</p>;
}
export const vanillaCounter = createStore<{ count: number }>()(() => ({ count: 0 }));

export async function runDemo(): Promise<void> {
  console.log('React:', renderToStaticMarkup(<Counter label="Visits" />));
  console.log('Vue:', vueTotal(), 'Angular:', angularTotal(), angularConfig());
  console.log('Next.js:', await nextSearch(new Request('https://example.invalid/search?q=hello')).json());
  console.log('Zod:', User.parse({ name: ' Ada ' }), 'Axios:', await axiosUsers());
  console.log('Lodash:', taskGroups(), 'date-fns:', dueDate(), 'RxJS:', await doubledEvens());
  await queryClient.fetchQuery({ queryKey: ['todos'], queryFn: loadTodos });
  console.log('TanStack Query:', renderToStaticMarkup(<TodoApp />));
  vanillaCounter.setState({ count: 1 });
  console.log('Zustand:', vanillaCounter.getState().count);
  queryClient.clear();
}
