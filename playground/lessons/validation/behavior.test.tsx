// Feasibility probes for authored outcomes, never loaded into lesson snippets.
import { afterEach, describe, expect, it } from 'vitest';
import { StrictMode, useEffect, useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { createStore } from 'zustand/vanilla';
import { z } from 'zod';
import express from 'express';
import { once } from 'node:events';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

afterEach(cleanup);

describe('typed and plain JavaScript task outcomes', () => {
  it('sums readonly inputs, narrows unknown and preserves optional empty labels', () => {
    const sum = (input: readonly number[]) => input.reduce((a,b) => a+b, 0);
    const score = (input: unknown): number | undefined => typeof input === 'number' && Number.isFinite(input) ? input : undefined;
    const label = (user: {name: string; nickname?: string}) => user.nickname ?? user.name;
    const input = [1,2,3];
    expect(sum(input)).toBe(6); expect(sum([])).toBe(0); expect(input).toEqual([1,2,3]);
    expect(score(0)).toBe(0); expect(score(2.5)).toBe(2.5);
    for (const bad of ['2', null, NaN]) expect(score(bad)).toBeUndefined();
    expect(label({name:'Ada'})).toBe('Ada'); expect(label({name:'Ada',nickname:''})).toBe('');
    // @ts-expect-error The task intentionally rejects a typed string array.
    sum(['wrong']);
  });
  it('groups unchanged records and validates strict quantities', () => {
    const rows = [{category:'book',amount:3},{category:'food',amount:2},{category:'book',amount:4}];
    const snapshot = JSON.stringify(rows);
    const totals = new Map<string,number>();
    for (const row of rows) totals.set(row.category,(totals.get(row.category) ?? 0)+row.amount);
    expect([...totals]).toEqual([['book',7],['food',2]]); expect(JSON.stringify(rows)).toBe(snapshot);
    const schema = z.object({name:z.string().min(1),quantity:z.number().int().positive()});
    expect(schema.parse({name:'Ada',quantity:2}).quantity).toBe(2);
    for (const quantity of [0,0.5,-1]) expect(schema.safeParse({name:'Ada',quantity}).success).toBe(false);
    expect(schema.safeParse({quantity:2}).success).toBe(false);
    expect(() => JSON.parse('{bad')).toThrow();
  });
  it('distinguishes HTTP, JSON and request errors without networking', async () => {
    const load = async (fetcher: () => Promise<Response>) => {
      const response = await fetcher();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    };
    await expect(load(async () => new Response('{"score":5}'))).resolves.toEqual({score:5});
    await expect(load(async () => new Response('',{status:500}))).rejects.toThrow('HTTP 500');
    await expect(load(async () => new Response('{bad'))).rejects.toThrow();
    await expect(load(async () => { throw new Error('offline'); })).rejects.toThrow('offline');
  });
  it('ignores stale completion even if an injected loader ignores abort', async () => {
    let controller: AbortController | undefined, sequence = 0, shown = '';
    let finishA!: (value: string) => void;
    const a = new Promise<string>(resolve => { finishA = resolve; });
    const start = async (loader: (signal: AbortSignal) => Promise<string>) => {
      controller?.abort(); controller = new AbortController();
      const id = ++sequence, signal = controller.signal;
      const value = await loader(signal);
      if (id === sequence && !signal.aborted) shown = value;
    };
    const first = start(() => a);
    await start(async () => 'B'); finishA('A'); await first;
    expect(shown).toBe('B'); controller?.abort();
  });
  it('runs exact price boundaries and independent closures', () => {
    const price = (n: number) => { if (n < 0) throw new Error('negative'); return n >= 100 ? n * 0.9 : n; };
    for (const [input,output] of [[99,99],[100,90],[200,180]] as const) expect(price(input)).toBe(output);
    expect(() => price(-1)).toThrow();
    const counter = (value: number) => ({increment: () => ++value, read: () => value});
    const a = counter(0), b = counter(10); a.increment(); a.increment();
    expect(a.read()).toBe(2); expect(b.read()).toBe(10);
  });
  it('reads real temporary files and propagates missing-file errors', async () => {
    const dir = await mkdtemp(join(tmpdir(),'syntaxiser-lesson-'));
    try {
      const file = join(dir,'daily notes.txt'); await writeFile(file,'one\n\nthree\n');
      expect((await readFile(file,'utf8')).split('\n').filter(Boolean)).toHaveLength(2);
      await expect(readFile(join(dir,'missing'),'utf8')).rejects.toThrow();
    } finally { await rm(dir,{recursive:true,force:true}); }
  });
});

describe('React and library feasibility', () => {
  it('types callbacks and tests actual click/disabled behavior', async () => {
    let count = 0;
    function Button({disabled=false,onIncrement}: {disabled?:boolean;onIncrement:()=>void}) {
      return <button disabled={disabled} onClick={onIncrement}>Increment</button>;
    }
    const view = render(<Button onIncrement={() => count++}/>);
    const user = userEvent.setup(); await user.click(screen.getByRole('button',{name:'Increment'}));
    expect(count).toBe(1);
    view.rerender(<Button disabled onIncrement={() => count++}/>);
    await user.click(screen.getByRole('button')); expect(count).toBe(1);
  });
  it('preserves typed input and trims only upon keyboard submit', async () => {
    let submitted = '';
    function Form() {
      const [value,setValue] = useState('');
      return <form onSubmit={event => {event.preventDefault();submitted=value.trim();}}>
        <label>Search<input value={value} onChange={event => setValue(event.currentTarget.value)}/></label>
        <button>Find</button></form>;
    }
    render(<Form/>); const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), ' Ada ');
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(' Ada ');
    await user.keyboard('{Enter}'); expect(submitted).toBe('Ada');
  });
  it('cleans source changes and unmount under StrictMode', () => {
    const source = () => new Set<() => void>(); const a = source(), b = source();
    function Subscriber({listeners}: {listeners:Set<() => void>}) {
      const [count,setCount] = useState(0);
      useEffect(() => {const handler=()=>setCount(n=>n+1);listeners.add(handler);return ()=>{listeners.delete(handler);};},[listeners]);
      return <output>{count}</output>;
    }
    const view = render(<StrictMode><Subscriber listeners={a}/></StrictMode>);
    expect(a.size).toBe(1);
    view.rerender(<StrictMode><Subscriber listeners={b}/></StrictMode>);
    expect(a.size).toBe(0); expect(b.size).toBe(1);
    view.unmount(); expect(b.size).toBe(0);
  });
  it('uses isolated QueryClients and Zustand store factories', async () => {
    const client = new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0,staleTime:Infinity}}});
    let loads = 0; const options = {queryKey:['items'],queryFn:async()=>++loads};
    try {
      expect(await client.fetchQuery(options)).toBe(1); expect(await client.fetchQuery(options)).toBe(1);
      await client.invalidateQueries({queryKey:['items']}); expect(await client.fetchQuery(options)).toBe(2);
      await expect(client.fetchQuery({queryKey:['bad'],queryFn:async()=>{throw new Error('local failure');}})).rejects.toThrow('local failure');
    } finally { client.clear(); }
    const factory = () => createStore<{quantity:number;add:()=>void;remove:()=>void}>()(set=>({quantity:0,add:()=>set(s=>({quantity:s.quantity+1})),remove:()=>set({quantity:0})}));
    const a = factory(), b = factory(); a.getState().add();a.getState().add();
    expect(a.getState().quantity*3).toBe(6);expect(b.getState().quantity).toBe(0);
    a.getState().remove();expect(a.getState().quantity).toBe(0);
  });
  it('validates real loopback Express requests and closes the server', async () => {
    const app = express(); app.use(express.json());
    const schema = z.object({name:z.string().trim().min(1),quantity:z.number().int().positive()});
    app.post('/items',(request,response)=>{
      const item=schema.safeParse(request.body);
      if (!item.success) {response.status(400).json({error:'invalid item'});return;}
      response.status(201).json(item.data);
    });
    const server = app.listen(0,'127.0.0.1'); await once(server,'listening');
    const address=server.address(); if (!address || typeof address==='string') throw new Error('missing address');
    const url=`http://127.0.0.1:${address.port}/items`;
    try {
      for (const [body,status] of [['{"name":"Ada","quantity":2}',201],['{"quantity":2}',400],['{bad',400]] as const) {
        const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body});
        expect(response.status).toBe(status); await response.text();
      }
    } finally { await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve())); }
  });
});
