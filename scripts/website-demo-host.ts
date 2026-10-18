// Browser-only replacement for VS Code's host. Never touches extension storage.
import { Retriever } from '../src/core/retrieval';
import { rustAdapter } from '../src/languages/rust';
import { LessonStore, parseLessonAction } from '../src/core/lessons';
import packData from '../packs/rust.json';
import referenceTopics from '../packs/rust-reference.json';
import type { ReferencePack } from '../src/core/types';

const pack = { ...packData, referenceTopics } as ReferencePack;
const retriever = new Retriever(pack);
const lessons = new LessonStore([{ languageId: 'rust', displayName: 'Rust' }]);
const examples = [
  'fn main() {\n    let values = vec![1, 2, 3, 4];\n    let iter = values.iter();\n}',
  'fn main() {\n    let value: Option<i32> = Some(42);\n    let result = value.unwrap_or(0);\n}',
  'fn main() {\n    let values = vec![1, 2, 3, 4];\n    let total = values.iter().fold(0, |sum, n| sum + n);\n}',
];
let current = 0;
let contextVersion = 0;
let query = '';
let pageSize = 12;
let pins: { languageId: string; card: ReferencePack['cards'][number]; collapsed: boolean }[] = [];
let pinsCollapsed = false;
let saved: unknown;
const params = new URLSearchParams(location.search);
const initial = params.get('view');
function state() {
  const text = examples[current];
  const offset = text.lastIndexOf(';');
  const context = rustAdapter.extract({ text, offset, recentEdits: [], symbols: [] });
  window.dispatchEvent(new MessageEvent('message', { data: {
    type: 'state', reference: pack, languageId: 'rust', language: 'Rust', scope: context.scope,
    contextVersion, relevant: retriever.relevant(context, 60).map(result => result.card),
    suggestedTopics: retriever.relevantTopics(context, 2), query,
    search: retriever.search(query, 60).map(result => result.card), searchTopics: retriever.searchTopics(query),
    pageSize, pins, pinsCollapsed, message: '', lessonLibraries: lessons.libraries(),
  } }));
}
function search(value: string) {
  const input = document.querySelector<HTMLInputElement>('#query')!;
  input.value = value;
  document.querySelector<HTMLFormElement>('#search-form')!.requestSubmit();
}
Object.assign(window, { acquireVsCodeApi: () => ({
  getState: () => saved, setState: (value: unknown) => { saved = value; },
  postMessage: (message: any) => {
    if (message.type === 'search') query = message.query;
    if (message.type === 'cardCount') pageSize = message.count;
    if (message.type === 'pin') {
      if (message.action === 'collapseAll') pinsCollapsed = message.collapsed;
      else {
        const card = pack.cards.find(card => card.id === message.cardId);
        if (!card) return;
        if (message.action === 'pin' && !pins.some(pin => pin.card.id === card.id)) pins.push({ languageId: 'rust', card, collapsed: false });
        if (message.action === 'unpin') pins = pins.filter(pin => pin.card.id !== card.id);
        if (message.action === 'collapse') pins.forEach(pin => { if (pin.card.id === card.id) pin.collapsed = message.collapsed; });
      }
    }
    if (message.type === 'lesson') {
      const action = parseLessonAction(message);
      if (action?.action === 'reset') lessons.reset('rust', action.all, true);
      else if (action) lessons.apply(action);
    }
    if (message.type === 'ready') {
      state();
      if (initial === 'search' || initial === 'pins') {
        if (initial === 'pins') pins = retriever.search('handle a missing value', 2).map(result => ({ languageId: 'rust', card: result.card, collapsed: true }));
        search('handle a missing value');
      }
    } else state();
  },
}) });

window.addEventListener('DOMContentLoaded', () => {
  if (initial !== 'context') return;
  const editor = document.createElement('section');
  editor.className = 'demo-editor';
  editor.innerHTML = '<p>In your editor · main.rs</p><pre><code></code><span aria-hidden="true">│</span></pre><p class="demo-context"></p><button type="button">Pause animation</button><button type="button">Next example</button>';
  document.body.prepend(editor);
  const code = editor.querySelector('code')!;
  const caption = editor.querySelector('.demo-context')!;
  const buttons = editor.querySelectorAll('button');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !media.matches;
  let timer: ReturnType<typeof setTimeout>;
  let typing: ReturnType<typeof setTimeout>;
  function show(animate = false) {
    clearTimeout(typing);
    const text = examples[current];
    let length = animate ? 0 : text.length;
    const tick = () => {
      code.textContent = text.slice(0, length);
      if (length < text.length) { length++; typing = setTimeout(tick, 24); }
      else { contextVersion++; state(); }
    };
    caption.textContent = ['Cursor near .iter() → iterator examples', 'Cursor near unwrap_or → missing-value examples', 'Cursor near .fold() → collection reduction examples'][current];
    tick();
  }
  function schedule() {
    clearTimeout(timer);
    if (playing && !document.hidden) timer = setTimeout(() => { current = (current + 1) % examples.length; show(true); schedule(); }, 6500);
    buttons[0].textContent = playing ? 'Pause animation' : 'Play animation';
    buttons[0].setAttribute('aria-pressed', String(playing));
  }
  function pause() { playing = false; clearTimeout(timer); clearTimeout(typing); code.textContent = examples[current]; schedule(); }
  buttons[0].onclick = () => { playing = !playing; show(); schedule(); };
  buttons[1].onclick = () => { current = (current + 1) % examples.length; pause(); show(); };
  // Keep the chosen view/search stable once the visitor starts exploring.
  document.addEventListener('pointerdown', event => { if (!editor.contains(event.target as Node)) pause(); });
  document.addEventListener('focusin', event => { if (!editor.contains(event.target as Node)) pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(timer); clearTimeout(typing); } else schedule(); });
  media.addEventListener('change', () => { if (media.matches) pause(); });
  show(); schedule();
});
