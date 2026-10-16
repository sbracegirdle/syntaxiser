import { once } from 'node:events';
import type { Express } from 'express';
import { expect, test } from 'vitest';
import { app } from './.catalog-depth/ts-express-validated.js';
import { createApp } from './.catalog-depth/ts-express-recovery.js';
async function serve(app: Express, run: (base: string) => Promise<void>) {
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening'); const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected ephemeral loopback listener');
    await run(`http://127.0.0.1:${address.port}`);
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
test('Express JSON: valid, trim boundary, schema rejection, malformed/large body and recovery', async () => {
  await serve(app, async base => {
    const send = (body: string) => fetch(base + '/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    const good = await send(JSON.stringify({ name: ' Ada ' })); expect(good.status).toBe(201); expect(await good.json()).toEqual({ name: 'Ada' });
    const blank = await send(JSON.stringify({ name: ' ' })); expect(blank.status).toBe(422); expect(await blank.json()).toEqual({ error: 'Invalid user', fields: ['name'] });
    expect((await send(JSON.stringify({ name: 'Ada', secret: 'x' }))).status).toBe(422);
    const broken = await send('{'); expect(broken.status).toBe(400); expect(await broken.json()).toEqual({ error: 'Invalid JSON body' });
    const huge = await send(JSON.stringify({ name: 'x'.repeat(2048) })); expect(huge.status).toBe(413); expect(await huge.json()).toEqual({ error: 'Invalid JSON body' });
    expect((await send(JSON.stringify({ name: 'Recovered' }))).status).toBe(201);
  });
});
test('Express rejected loader: success, empty-string boundary, missing and recovery after error', async () => {
  const app = createApp(async id => { if (id === 'fail') throw new Error('private database detail'); return id === 'missing' ? undefined : id === 'empty' ? '' : 'Ada'; });
  await serve(app, async base => {
    const good = await fetch(base + '/items/1'); expect(good.status).toBe(200); expect(await good.json()).toEqual({ value: 'Ada' });
    const empty = await fetch(base + '/items/empty'); expect(empty.status).toBe(200); expect(await empty.json()).toEqual({ value: '' });
    const missing = await fetch(base + '/items/missing'); expect(missing.status).toBe(404); expect(await missing.json()).toEqual({ error: 'Not found' });
    const failure = await fetch(base + '/items/fail'); expect(failure.status).toBe(503); expect(await failure.json()).toEqual({ error: 'Try again' });
    expect((await fetch(base + '/items/1')).status).toBe(200);
  });
});
