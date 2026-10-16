// Runnable exact-catalog tour; generated modules are ignored by Git.
import { buildPlayground } from './build.mjs';
import { fileURLToPath } from 'node:url';
await buildPlayground();
// The checker compiles all modules. The tour bundles just the modules it executes.
import { build } from 'esbuild';
async function recipe(id) {
  await build({entryPoints:[fileURLToPath(new URL(`.catalog/js-${id}.jsx`,import.meta.url))],outfile:fileURLToPath(new URL(`.catalog/js-${id}.mjs`,import.meta.url)),bundle:true,packages:'external',platform:'node',format:'esm'});
  return import(new URL(`.catalog/js-${id}.mjs`,import.meta.url));
}
const { batches } = await recipe('generators-batches');
console.log('Lazy batches:', [...batches([1,2,3,4,5],2)]);
const { ticketIds } = await recipe('regex-capture');
console.log('Captured IDs:', ticketIds('TASK-12 and TASK-007'));
const { readPolicy } = await recipe('json-read');
console.log('JSON recovery:', readPolicy('broken'));
const { batchReport } = await recipe('promise-combinators-report');
console.log('Promise outcomes:', await batchReport([()=>1,()=>Promise.reject('offline')]));
const { schedulingTrace } = await recipe('event-loop-trace');
console.log('Event loop:', await schedulingTrace());
const { fileLocation } = await recipe('node-paths-url');
console.log('File URL:', fileLocation('a #b.txt'));
// These small executable declarations give the sidebar real cursor context.
function* lines(items) { for (const item of items) yield item; }
const cache = new WeakMap();
const context = { count: 0, next() { return ++this.count; } };
const bound = context.next.bind(context);
console.log('Receiver:', bound(), 'Protocol:', [...lines(['one'])][Symbol.iterator]().next().value);
cache.set(context, JSON.parse('{"ready":true}'));
queueMicrotask(() => console.log('Cached:', cache.get(context)));
