import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';
const here = dirname(fileURLToPath(import.meta.url));
export async function buildPlayground() {
  const generated = join(here, '.catalog');
  await rm(generated, { recursive: true, force: true });
  await mkdir(generated, { recursive: true });
  for (const language of ['javascript', 'typescript']) {
    const pack = JSON.parse(await readFile(join(here, '../../packs', `${language}.json`), 'utf8'));
    for (const card of pack.cards.filter(card => language === 'javascript' || card.id.startsWith('tsx-') || card.id.startsWith('ts-'))) {
      await writeFile(join(generated, `${card.id}${/vitest|testing-library/.test(card.id) ? ".test" : ""}.${language === 'javascript' ? 'jsx' : 'tsx'}`), card.code);
    }
  }
  const entry = `import { createRoot } from 'react-dom/client';
import { createElement, Fragment } from 'react';
${['js', 'tsx'].map(prefix => ['react-props', 'react-events', 'react-state', 'react-list', 'react-effect', 'react-fetch', 'react-ref'].map((topic,i) => `import * as ${prefix.replace('tsx','ts')}${i} from './${prefix}-${topic}.${prefix==='js'?'jsx':'tsx'}';`).join('\n')).join('\n')}
const root = createRoot(document.getElementById('root'));
window.renderExamples = (typed = false, url = '/status') => {
 const [props, events, state, list, effect, request, ref] = typed ? [ts0,ts1,ts2,ts3,ts4,ts5,ts6] : [js0,js1,js2,js3,js4,js5,js6];
 root.render(createElement(Fragment, null,
  createElement(props.Panel, {title: 'Task panel'}, createElement('p', null, 'Nested child')),
  createElement(events.NameField), createElement(state.Counter, { label: 'Visits' }),
  createElement(list.TaskList, {tasks:[{id:'a',name:'Learn JSX'},{id:'b',name:'Test cleanup'}]}),
  createElement(effect.WindowWidth), createElement(request.RemoteStatus,{url}), createElement(ref.FocusField)));
};
window.unmountExamples = () => root.unmount();
window.renderExamples(new URLSearchParams(location.search).has('typed'));
`;
  await writeFile(join(generated, 'browser.jsx'), entry);
  await mkdir(join(here, 'dist'), { recursive: true });
  await build({ entryPoints: [join(generated, 'browser.jsx')], outfile: join(here, 'dist/browser.js'), bundle: true, format: 'iife', jsx: 'automatic' });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await buildPlayground();
