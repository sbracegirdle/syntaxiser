const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const pack = { ...require('../packs/rust.json'), referenceTopics: require('../packs/rust-reference.json') };

const html = `<!doctype html><html><body>
<nav><button id="context-tab"></button><button id="reference-tab"></button><button id="lessons-tab"></button><button id="lesson-browser-tab"></button></nav>
${fs.readFileSync(require.resolve('../src/sidebar.ts'), 'utf8').match(/  <section id="lessons-section"[\s\S]*?\n  <\/section>/)[0]}
<section id="reference-section" hidden><h1 id="reference-heading"></h1><nav id="reference-navigation"><input id="topic-query"><p id="topic-search-message" hidden></p><div id="reference-topics"></div></nav><h2 id="reference-topic-heading" tabindex="-1"></h2><p id="reference-message"></p><div id="reference-results"></div></section>
<section id="suggested-topics-section" hidden><h2>Relevant topics</h2><div id="suggested-topics"></div></section>
<span id="language"></span><section id="relevant-section"><span id="scope"></span><p id="context-message"></p><div id="relevant"></div><button id="relevant-more" hidden></button></section>
<select id="card-count">${[5, 12, 20, 30].map(count => `<option value="${count}">${count} cards</option>`).join('')}</select>
<form id="search-form"><input id="query"></form><section id="search-section" hidden><p id="search-message"></p><div id="search-results"></div><button id="search-more" hidden></button></section>
<section id="pinned-section" hidden><button id="pins-toggle"></button><div id="pinned" class="cards"></div></section>
</body></html>`;
const script = fs.readFileSync(require.resolve('../media/sidebar.js'), 'utf8');
const highlight = fs.readFileSync(require.resolve('../media/highlight.js'), 'utf8');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function harness(saved) {
  const messages = [];
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  dom.window.acquireVsCodeApi = () => ({ getState: () => saved, setState: value => messages.push({ saved: value }), postMessage: value => messages.push(value) });
  dom.window.eval(highlight);
  dom.window.eval(fs.readFileSync(require.resolve('../media/lessons.js'), 'utf8'));
  dom.window.eval(script);
  const state = patch => dom.window.dispatchEvent(new dom.window.MessageEvent('message', { data: {
    type: 'state', languageId: 'rust', language: 'Rust', scope: 'module', pageSize: 12, relevant: pack.cards.slice(0, 5), search: [], query: '', message: '', pins: [], pinsCollapsed: false, ...patch,
  } }));
  return { dom, document: dom.window.document, messages, state };
}

test('lessons tab restores preferences, pins to-do tasks, filters levels and hides completed work', () => {
  const { LessonStore } = require('../out/core/lessons');
  const store = new LessonStore([{ languageId: 'rust', displayName: 'Rust' }, { languageId: 'go', displayName: 'Go' }]);
  store.apply({ action: 'status', languageId: 'rust', id: 'capstone', status: 'todo' });
  store.apply({ action: 'status', languageId: 'rust', id: 'hello', status: 'done' });
  const h = harness({ mode: 'lessons', lessonHideDone: true });
  try {
    const get = id => h.document.getElementById(id);
    h.state({ lessonLibraries: store.libraries(), pins: [{ languageId: 'rust', card: pack.cards[0] }] });
    assert.equal(get('lessons-section').hidden, false);
    for (const id of ['relevant-section', 'search-form', 'reference-section', 'pinned-section', 'card-count']) assert.equal(get(id).hidden, true);
    assert.match(get('lesson-summary').textContent, /1 of 12 done.*1 to do/);
    assert.equal(h.document.querySelector('.lesson-card').dataset.id, 'capstone', 'to-do tasks stay pinned above the learning path');
    assert.equal(h.document.querySelectorAll('.lesson-card').length, 1, 'tracker excludes untracked catalog lessons');
    get('lesson-difficulty').value = '5';
    get('lesson-difficulty').dispatchEvent(new h.dom.window.Event('change'));
    assert.equal(h.document.querySelectorAll('.lesson-card').length, 1);
    const progress = h.document.querySelector('.lesson-progress[data-status="in-progress"]');
    progress.focus(); progress.click();
    assert.deepEqual(JSON.parse(JSON.stringify(h.messages.at(-1))), { type: 'lesson', languageId: 'rust', action: 'status', id: 'capstone', status: 'in-progress' });
    store.apply({ action: 'status', languageId: 'rust', id: 'capstone', status: 'in-progress' });
    h.state({ lessonLibraries: store.libraries() });
    assert.equal(h.document.activeElement.className, 'lesson-progress');
    assert.equal(h.document.activeElement.dataset.status, 'in-progress');
    assert.equal(h.document.activeElement.getAttribute('aria-pressed'), 'true');
    h.document.activeElement.click();
    assert.equal(h.messages.at(-1).status, 'untracked', 'click the current status once to stop tracking');
    get('lesson-difficulty').value = 'all'; get('lesson-difficulty').dispatchEvent(new h.dom.window.Event('change'));
    get('lesson-status').value = 'done'; get('lesson-status').dispatchEvent(new h.dom.window.Event('change'));
    assert.equal(get('lesson-hide-done').getAttribute('aria-pressed'), 'false');
    assert.equal(h.document.querySelectorAll('.lesson-card').length, 1);
    h.state({ lessonLibraries: store.libraries(), languageId: 'go', language: 'Go' });
    assert.equal(get('lesson-empty').hidden, false, 'Go has separate progress');
    assert.equal(get('lesson-language'), null, 'lessons use current context instead of a picker');
    get('context-tab').click();
    assert.equal(get('lessons-section').hidden, true);
    assert.equal(get('relevant-section').hidden, false);
  } finally { h.dom.window.close(); }
});

test('custom lesson form sends bounded fields, renders text safely and supports editing and deletion', () => {
  const { LessonStore } = require('../out/core/lessons');
  const store = new LessonStore([{ languageId: 'rust', displayName: 'Rust' }]);
  store.apply({ action: 'status', languageId: 'rust', id: 'capstone', status: 'todo' });
  const h = harness({ mode: 'lessons', lessonOrder: 'hard' });
  try {
    const get = id => h.document.getElementById(id);
    h.state({ lessonLibraries: store.libraries() });
    assert.equal(h.document.querySelector('.lesson-card').dataset.id, 'capstone');
    get('lesson-new').click();
    assert.equal(get('lesson-form').hidden, false);
    assert.equal(h.document.activeElement, get('lesson-title'));
    get('lesson-title').value = '<img src=x onerror=alert(1)>';
    get('lesson-instructions').value = '<script>unsafe()</script>';
    assert.equal(get('lesson-form').querySelectorAll('input, textarea, select').length, 2);
    get('lesson-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    const action = h.messages.findLast(message => message.type === 'lesson');
    assert.equal(action.action, 'save');
    assert.equal(action.lesson.check, '');
    assert.equal(action.lesson.starter, '');
    assert.equal(action.lesson.difficulty, 1);
    store.apply(action);
    h.state({ lessonLibraries: store.libraries() });
    const card = h.document.querySelector('.lesson-card:has(.lesson-edit)');
    assert.ok(card.textContent.includes('<img src=x onerror=alert(1)>'));
    assert.equal(card.querySelectorAll('img, script').length, 0);
    card.querySelector('.lesson-edit').click();
    assert.equal(get('lesson-title').value, action.lesson.title);
    get('lesson-title').value = 'Revised title';
    get('lesson-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    assert.equal(h.messages.findLast(message => message.type === 'lesson').id, card.dataset.id);
    card.querySelector('.lesson-delete').click();
    assert.equal(h.messages.at(-1).action, 'delete');
    get('lesson-reset-language').click();
    assert.equal(h.messages.at(-1).all, false);
    get('lesson-reset-all').click();
    assert.equal(h.messages.at(-1).all, true);
  } finally { h.dom.window.close(); }
});

test('new custom lessons retain the difficulty selected when the form opens', () => {
  const { LessonStore } = require('../out/core/lessons');
  const store = new LessonStore([{ languageId: 'rust', displayName: 'Rust' }]);
  const h = harness({ mode: 'lessons', lessonDifficulty: '3' });
  try {
    h.state({ lessonLibraries: store.libraries() });
    const get = id => h.document.getElementById(id);
    get('lesson-new').click();
    get('lesson-title').value = 'My iterator challenge';
    get('lesson-instructions').value = 'Write an iterator.';
    get('lesson-difficulty').value = '5';
    get('lesson-difficulty').dispatchEvent(new h.dom.window.Event('change'));
    get('lesson-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    assert.equal(h.messages.findLast(message => message.type === 'lesson').lesson.difficulty, 3);
  } finally { h.dom.window.close(); }
});

test('lessons show task content immediately and reveal overflow with Show more', () => {
  const { LessonStore } = require('../out/core/lessons');
  const store = new LessonStore([{ languageId: 'rust', displayName: 'Rust' }]);
  store.apply({ action: 'status', languageId: 'rust', id: 'hello', status: 'in-progress' });
  const h = harness({ mode: 'lessons' });
  try {
    h.state({ lessonLibraries: store.libraries() });
    assert.equal(h.document.querySelector('#lesson-list details'), null);
    const card = h.document.querySelector('.lesson-card');
    const body = card.querySelector('.lesson-body');
    assert.ok(body.textContent.includes(store.libraries()[0].lessons[0].instructions));
    const more = card.querySelector('.lesson-more');
    assert.equal(more.hidden, true, 'short content needs no expansion control');
    Object.defineProperties(body, { scrollHeight: { value: 500 }, clientHeight: { value: 240 } });
    h.dom.window.dispatchEvent(new h.dom.window.Event('resize'));
    assert.equal(more.hidden, false);
    more.click();
    assert.equal(body.classList.contains('expanded'), true);
    assert.equal(more.textContent, 'Show less');
    assert.equal(more.getAttribute('aria-expanded'), 'true');
    store.apply({ action: 'status', languageId: 'rust', id: 'hello', status: 'todo' });
    h.state({ lessonLibraries: store.libraries() });
    assert.equal(h.document.querySelector('.lesson-card .lesson-body').classList.contains('expanded'), true, 'status changes retain expansion');
  } finally { h.dom.window.close(); }
});

test('lesson states have visible markers and hidden tasks can be restored', () => {
  const { LessonStore } = require('../out/core/lessons');
  const store = new LessonStore([{ languageId: 'rust', displayName: 'Rust' }]);
  for (const [id, status] of [['hello', 'todo'], ['variables', 'in-progress'], ['functions', 'done']]) {
    store.apply({ action: 'status', languageId: 'rust', id, status });
  }
  const h = harness({ mode: 'lessons' });
  try {
    const get = id => h.document.getElementById(id);
    h.state({ lessonLibraries: store.libraries() });
    for (const [id, status, marker] of [['hello', 'todo', '◇ To do'], ['variables', 'in-progress', '◔ In progress'], ['functions', 'done', '✓ Done']]) {
      const card = h.document.querySelector(`.lesson-card[data-id="${id}"]`);
      assert.equal(card.dataset.status, status);
      assert.equal(card.querySelector('.lesson-state').textContent, marker);
    }
    h.document.querySelector('.lesson-card[data-id="hello"] .lesson-hide').click();
    const hide = h.messages.at(-1);
    assert.equal(hide.status, 'hidden');
    store.apply(hide);
    h.state({ lessonLibraries: store.libraries() });
    assert.equal(h.document.querySelector('.lesson-card[data-id="hello"]'), null);
    assert.match(get('lesson-summary').textContent, /of 11 done.*1 hidden/);
    get('lesson-hide-done').click(); // Showing done never reveals individually hidden lessons.
    get('lesson-hide-done').click();
    assert.equal(h.document.querySelector('.lesson-card[data-id="hello"]'), null);
    get('lesson-status').value = 'hidden';
    get('lesson-status').dispatchEvent(new h.dom.window.Event('change'));
    assert.equal(h.document.querySelectorAll('.lesson-card').length, 1);
    const card = h.document.querySelector('.lesson-card');
    assert.equal(card.querySelector('.lesson-state').textContent, '⊘ Hidden');
    assert.match(card.querySelector('.lesson-hide').getAttribute('aria-label'), /^Restore lesson/);
    card.querySelector('.lesson-hide').click();
    const restore = h.messages.at(-1);
    assert.equal(restore.status, 'untracked');
    store.apply(restore);
    h.state({ lessonLibraries: store.libraries() });
    assert.equal(get('lesson-empty').hidden, false);
    get('lesson-status').value = 'all'; get('lesson-status').dispatchEvent(new h.dom.window.Event('change'));
    assert.equal(h.document.querySelector('.lesson-card[data-id="hello"]'), null, 'restored untracked tasks belong in the browser');
  } finally { h.dom.window.close(); }
});

test('two-field editing keeps existing custom code, difficulty and completion checks', () => {
  const { LessonStore } = require('../out/core/lessons');
  const store = new LessonStore([{ languageId: 'rust', displayName: 'Rust' }, { languageId: 'go', displayName: 'Go' }]);
  const legacy = { title: 'Legacy task', instructions: 'Try this', starter: 'fn main() {}', check: 'Run tests', difficulty: 4 };
  store.apply({ action: 'save', languageId: 'rust', lesson: legacy });
  const h = harness({ mode: 'lessons' });
  try {
    const get = id => h.document.getElementById(id);
    h.state({ lessonLibraries: store.libraries() });
    h.document.querySelector('.lesson-edit').click();
    get('lesson-title').value = 'Edited task';
    get('lesson-instructions').value = 'Changed instructions';
    h.state({ lessonLibraries: store.libraries(), languageId: 'go' });
    assert.equal(get('lesson-instructions').value, 'Changed instructions');
    get('lesson-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    const action = h.messages.findLast(message => message.type === 'lesson');
    assert.equal(action.languageId, 'rust');
    assert.deepEqual(JSON.parse(JSON.stringify(action.lesson)), { ...legacy, title: 'Edited task', instructions: 'Changed instructions' });
  } finally { h.dom.window.close(); }
});

test('lessons follow current context and keep WIP before upcoming tasks in either difficulty order', () => {
  const { LessonStore } = require('../out/core/lessons');
  const store = new LessonStore([{ languageId: 'rust', displayName: 'Rust' }, { languageId: 'go', displayName: 'Go' }]);
  for (const [id, status] of [['variables', 'in-progress'], ['capstone', 'in-progress'], ['threads', 'todo']]) {
    store.apply({ action: 'status', languageId: 'rust', id, status });
  }
  store.apply({ action: 'save', languageId: 'rust', lesson: { title: 'Personal task', difficulty: 3, instructions: 'Practice your topic.', starter: '', check: '' } });
  const customId = store.libraries()[0].lessons.find(lesson => lesson.custom).id;
  const h = harness({ mode: 'lessons', lessonLanguage: 'go' });
  try {
    const ids = () => [...h.document.querySelectorAll('.lesson-card')].map(card => card.dataset.id);
    h.state({ lessonLibraries: store.libraries() });
    assert.deepEqual(ids().slice(0, 4), ['variables', 'capstone', customId, 'threads']);
    assert.deepEqual([...h.document.querySelectorAll('#lesson-list > h2')].map(node => node.textContent), ['In progress', 'To do']);
    assert.equal(h.document.querySelector('#lesson-list pre'), null, 'built-ins no longer show comment-only snippets');
    const personal = h.document.querySelector('[data-custom="true"]');
    assert.equal(personal.dataset.status, 'todo');
    assert.equal(personal.querySelector('.lesson-origin').textContent, 'Your lesson');
    h.document.getElementById('lesson-order').click();
    assert.deepEqual(ids().slice(0, 4), ['capstone', 'variables', 'threads', customId]);
    h.state({ lessonLibraries: store.libraries(), languageId: 'go', language: 'Go' });
    assert.deepEqual(ids(), [], 'Go has no tracked work yet');
    h.state({ lessonLibraries: store.libraries() });
    assert.ok(ids().includes('variables') && ids().includes(customId));
  } finally { h.dom.window.close(); }
});

test('lesson browser groups every title by difficulty, shares progress and restores selections per language', () => {
  const { LessonStore } = require('../out/core/lessons');
  const store = new LessonStore([{ languageId: 'rust', displayName: 'Rust' }, { languageId: 'go', displayName: 'Go' }]);
  const h = harness({ mode: 'lessons' });
  try {
    const get = id => h.document.getElementById(id);
    const state = (languageId = 'rust') => h.state({ lessonLibraries: store.libraries(), languageId });
    state();
    assert.equal(get('lesson-empty').hidden, false);
    get('lesson-browse').click();
    assert.equal(get('lesson-browser-tab').getAttribute('aria-pressed'), 'true');
    assert.equal(get('lesson-tracker').hidden, true);
    assert.equal(get('lesson-browser').hidden, false);
    assert.deepEqual([...h.document.querySelectorAll('#lesson-tree > ul > li')].map(node => node.dataset.difficulty), ['1', '2', '3', '4', '5']);
    assert.equal(h.document.querySelectorAll('#lesson-tree [data-lesson]').length, 12);
    assert.equal(get('lesson-detail').children.length, 0);
    h.document.querySelector('#lesson-tree [data-lesson="hello"]').click();
    assert.ok(get('lesson-detail').textContent.includes(store.libraries()[0].lessons[0].instructions));
    assert.equal(h.document.activeElement, get('lesson-selection-heading'));
    assert.equal(get('lesson-detail').querySelector('.lesson-more'), null, 'browser shows the complete selected lesson');
    get('lesson-detail').querySelector('[data-status="todo"].lesson-progress').click();
    store.apply(h.messages.at(-1)); state();
    assert.equal(get('lesson-detail').querySelector('.lesson-card').dataset.status, 'todo');
    get('lessons-tab').click();
    assert.equal(get('lesson-browser').hidden, true);
    assert.equal(h.document.querySelector('#lesson-list .lesson-card').dataset.id, 'hello');
    get('lesson-browser-tab').click();
    assert.equal(h.document.querySelector('#lesson-tree [aria-pressed="true"]').dataset.lesson, 'hello');
    state('go');
    assert.equal(get('lesson-detail').children.length, 0, 'Rust selection is not reused for Go');
    h.document.querySelector('#lesson-tree [data-lesson="slices"]').click();
    state();
    assert.equal(get('lesson-detail').querySelector('.lesson-card').dataset.id, 'hello');
    const saved = JSON.parse(JSON.stringify(h.messages.findLast(message => message.saved).saved));
    const restored = harness(saved);
    try {
      restored.state({ lessonLibraries: store.libraries() });
      assert.equal(restored.document.getElementById('lesson-browser').hidden, false);
      assert.equal(restored.document.querySelector('#lesson-detail .lesson-card').dataset.id, 'hello');
    } finally { restored.dom.window.close(); }
  } finally { h.dom.window.close(); }
});

test('browser respects hidden and difficulty filters and safely renders personal titles', () => {
  const { LessonStore } = require('../out/core/lessons');
  const store = new LessonStore([{ languageId: 'rust', displayName: 'Rust' }]);
  store.apply({ action: 'status', languageId: 'rust', id: 'hello', status: 'hidden' });
  store.apply({ action: 'save', languageId: 'rust', lesson: { title: '<img src=x onerror=alert(1)>', difficulty: 2, instructions: 'Personal practice', starter: '', check: '' } });
  const personal = store.libraries()[0].lessons.find(lesson => lesson.custom);
  const h = harness({ mode: 'lesson-browser' });
  try {
    h.state({ lessonLibraries: store.libraries() });
    assert.equal(h.document.querySelector('#lesson-tree [data-lesson="hello"]'), null);
    h.document.querySelector(`#lesson-tree [data-lesson="${personal.id}"]`).click();
    assert.ok(h.document.getElementById('lesson-detail').textContent.includes(personal.title));
    assert.equal(h.document.querySelectorAll('img').length, 0);
    const status = h.document.getElementById('lesson-status'); status.value = 'hidden';
    status.dispatchEvent(new h.dom.window.Event('change'));
    h.document.querySelector('#lesson-tree [data-lesson="hello"]').click();
    assert.equal(h.document.querySelector('#lesson-detail .lesson-card').dataset.status, 'hidden');
    const difficulty = h.document.getElementById('lesson-difficulty'); difficulty.value = '5';
    difficulty.dispatchEvent(new h.dom.window.Event('change'));
    assert.equal(h.document.querySelectorAll('#lesson-tree [data-lesson]').length, 0);
    assert.equal(h.document.getElementById('lesson-browser-message').hidden, false);
  } finally { h.dom.window.close(); }
});

test('sidebar renders code-only cards and escapes markup safely', () => {
  const h = harness();
  try {
    h.state({ relevant: [{ ...pack.cards[0], code: '<img src=x onerror="alert(1)">\nfn f<T>() {}' }] });
    assert.equal(h.document.querySelectorAll('article').length, 1);
    assert.equal(h.document.querySelector('article').children.length, 2);
    assert.equal(h.document.querySelector('article pre').children.length, 1);
    assert.ok(h.document.querySelector('code').textContent.includes('<img'));
    assert.equal(h.document.querySelectorAll('img').length, 0);
    assert.ok(h.document.querySelector('code .hljs-keyword'));
    assert.equal(h.document.querySelector('pre').tabIndex, 0);
    h.state();
    assert.equal(h.document.querySelectorAll('#relevant article').length, 5);
    assert.equal(h.document.getElementById('scope').textContent, 'FILE SCOPE');
    assert.equal(h.document.getElementById('context-message').hidden, true);
  } finally { h.dom.window.close(); }
});

test('styled explanations work across result lists and pins without changing snippet contents', () => {
  const h = harness();
  try {
    const explanation = 'Reads <img src=x onerror="alert(1)"> as text, without changing the code.';
    const card = { ...pack.cards[0], explanation };
    const check = (selector, text) => {
      const article = h.document.querySelector(selector);
      const pre = article.querySelector('pre');
      assert.equal(pre.hasAttribute('title'), false, 'native tooltips must be removed');
      const info = article.querySelector('.info-button');
      assert.ok(info);
      assert.equal(info.getAttribute('aria-haspopup'), 'dialog');
      info.click();
      const popup = h.document.getElementById('explanation');
      assert.equal(popup.hidden, false);
      assert.equal(popup.parentElement, h.document.body, 'popover must stay outside card layout');
      assert.equal(h.document.getElementById('explanation-heading').textContent, card.title);
      assert.equal(h.document.getElementById('explanation-text').textContent, explanation);
      assert.equal(info.getAttribute('aria-expanded'), 'true');
      assert.equal(pre.getAttribute('aria-label'), card.title);
      assert.equal(pre.getAttribute('aria-description'), explanation);
      assert.equal(pre.tabIndex, 0);
      assert.equal(article.children.length, 2, 'popover must not add elements to the card body');
      assert.equal(pre.children.length, 1);
      assert.equal(pre.textContent, text, 'copying code must not include explanations');
      assert.equal(h.document.querySelectorAll('img').length, 0);
      pre.focus();
      assert.equal(h.document.activeElement, pre);
    };
    h.state({ relevant: [card] });
    check('#relevant article', card.code);
    const query = h.document.getElementById('query');
    query.value = 'imports';
    h.document.getElementById('search-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    h.state({ query: query.value, search: [card] });
    check('#search-results article', card.code);
    h.state({ query: query.value, search: [card], pins: [{ languageId: 'rust', card, collapsed: false }] });
    check('#pinned article', card.code);
    h.state({ query: query.value, search: [card], pins: [{ languageId: 'rust', card, collapsed: true }] });
    check('#pinned article', card.code.split('\n')[0]);
  } finally { h.dom.window.close(); }
});

test('explanations update independently of code and remain optional', () => {
  const h = harness();
  try {
    const { explanation, ...legacy } = pack.cards[0];
    for (const optional of [undefined, '', '   ']) {
      h.state({ relevant: [{ ...legacy, explanation: optional }] });
      const pre = h.document.querySelector('#relevant pre');
      assert.equal(pre.hasAttribute('title'), false);
      assert.equal(pre.hasAttribute('aria-description'), false);
      assert.equal(pre.closest('article').querySelector('.info-button'), null);
      assert.equal(pre.textContent, legacy.code);
    }
    const card = { ...legacy, explanation: 'First explanation.' };
    h.state({ relevant: [card] });
    h.document.querySelector('#relevant .info-button').click();
    assert.equal(h.document.getElementById('explanation-text').textContent, card.explanation);
    const updated = { ...card, explanation: 'Updated explanation.' };
    h.state({ relevant: [updated] });
    assert.equal(h.document.getElementById('explanation').hidden, true, 'replaced cards must dismiss their popover');
    h.document.querySelector('#relevant .info-button').click();
    assert.equal(h.document.getElementById('explanation-text').textContent, updated.explanation);
    assert.equal(h.document.querySelector('#relevant pre').textContent, legacy.code);
    h.state({ relevant: [legacy] });
    assert.equal(h.document.querySelector('#relevant pre').hasAttribute('title'), false);
    h.state({ relevant: pack.cards.slice(0, 24) });
    h.document.getElementById('relevant-more').click();
    const appended = h.document.querySelectorAll('#relevant pre')[12];
    appended.closest('article').querySelector('.info-button').click();
    assert.equal(h.document.getElementById('explanation-text').textContent, pack.cards[12].explanation);
  } finally { h.dom.window.close(); }
});

test('hover explanations allow moving into the panel, while explicit openings stay until dismissed', async () => {
  const h = harness();
  try {
    h.state();
    const pre = h.document.querySelector('#relevant pre');
    const info = h.document.querySelector('#relevant .info-button');
    const popup = h.document.getElementById('explanation');
    pre.dispatchEvent(new h.dom.window.Event('pointerenter'));
    assert.equal(popup.hidden, true, 'hover should have a short delay');
    await delay(480);
    assert.equal(popup.hidden, false);
    pre.dispatchEvent(new h.dom.window.Event('pointerleave'));
    popup.dispatchEvent(new h.dom.window.Event('pointerenter'));
    await delay(210);
    assert.equal(popup.hidden, false, 'panel must stay open while reading or selecting its text');
    popup.dispatchEvent(new h.dom.window.Event('pointerleave'));
    await delay(210);
    assert.equal(popup.hidden, true);
    info.dispatchEvent(new h.dom.window.MouseEvent('click', { bubbles: true, detail: 1 }));
    pre.dispatchEvent(new h.dom.window.Event('pointerleave'));
    await delay(210);
    assert.equal(popup.hidden, false, 'clicking the info button must keep the panel open');
    info.dispatchEvent(new h.dom.window.MouseEvent('click', { bubbles: true, detail: 1 }));
    assert.equal(popup.hidden, true, 'clicking again must close the panel');
    info.click();
    assert.equal(h.document.activeElement, h.document.querySelector('.explanation-close'));
    h.document.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(popup.hidden, true);
    assert.equal(h.document.activeElement, info, 'keyboard dismissal must return focus to the info button');
    info.click();
    h.document.body.dispatchEvent(new h.dom.window.Event('pointerdown', { bubbles: true }));
    assert.equal(popup.hidden, true);
    pre.dispatchEvent(new h.dom.window.Event('pointerenter'));
    pre.dispatchEvent(new h.dom.window.Event('pointerleave'));
    await delay(480);
    assert.equal(popup.hidden, true, 'a short hover must not open the panel later');
  } finally { h.dom.window.close(); }
});

test('explanations fit viewport edges and dismiss during scrolling or search changes', () => {
  const h = harness();
  try {
    h.state();
    const popup = h.document.getElementById('explanation');
    const pre = h.document.querySelector('#relevant pre');
    const info = h.document.querySelector('#relevant .info-button');
    pre.getBoundingClientRect = () => ({ left: 900, top: 700, bottom: 740 });
    popup.getBoundingClientRect = () => ({ width: 360, height: 120 });
    info.click();
    assert.equal(popup.style.left, '652px');
    assert.equal(popup.style.top, '574px', 'near the bottom, the panel must open above the code');
    h.document.dispatchEvent(new h.dom.window.Event('scroll'));
    assert.equal(popup.hidden, true);
    Object.defineProperty(h.dom.window, 'innerWidth', { value: 220, configurable: true });
    Object.defineProperty(h.dom.window, 'innerHeight', { value: 160, configurable: true });
    pre.getBoundingClientRect = () => ({ left: 20, top: 100, bottom: 150 });
    popup.getBoundingClientRect = () => ({ width: 196, height: 136 });
    info.click();
    assert.equal(popup.style.left, '12px');
    assert.equal(popup.style.top, '12px');
    const query = h.document.getElementById('query');
    query.value = 'another query';
    query.dispatchEvent(new h.dom.window.Event('input'));
    assert.equal(popup.hidden, true, 'hidden result sections must not leave explanations onscreen');
  } finally { h.dom.window.close(); }
});

test('explanation text is selectable and selecting code dismisses the overlay', () => {
  const h = harness();
  try {
    h.state();
    h.document.querySelector('#relevant .info-button').click();
    const popup = h.document.getElementById('explanation');
    const selection = h.dom.window.getSelection();
    const range = h.document.createRange();
    range.selectNodeContents(h.document.getElementById('explanation-text'));
    selection.addRange(range);
    h.document.dispatchEvent(new h.dom.window.Event('selectionchange'));
    assert.equal(popup.hidden, false, 'explanation text should remain available to copy');
    selection.removeAllRanges();
    range.selectNodeContents(h.document.querySelector('#relevant code'));
    selection.addRange(range);
    h.document.dispatchEvent(new h.dom.window.Event('selectionchange'));
    assert.equal(popup.hidden, true, 'overlay should get out of the way when selecting code');
    assert.equal(selection.toString(), pack.cards[0].code);
  } finally { h.dom.window.close(); }
});

test('pin controls keep cards available without duplicates and collapse individually or together', () => {
  const h = harness();
  try {
    const card = pack.cards[0];
    h.state();
    assert.equal(h.document.getElementById('pinned-section').hidden, true);
    h.document.querySelector('#relevant .pin-button').click();
    assert.deepEqual(JSON.parse(JSON.stringify(h.messages.at(-1))), { type: 'pin', action: 'pin', languageId: 'rust', cardId: card.id });
    const pins = [{ languageId: 'rust', card, collapsed: false }];
    h.state({ pins });
    assert.equal(h.document.getElementById('pinned-section').hidden, false);
    assert.equal(h.document.querySelectorAll('#relevant article').length, 4);
    assert.equal(h.document.querySelector('#pinned code').textContent, card.code);
    const node = h.document.querySelector('#pinned article');
    h.state({ pins, relevant: pack.cards.slice(12, 24) });
    assert.equal(h.document.querySelector('#pinned article'), node, 'context updates should preserve pinned nodes');
    const query = h.document.getElementById('query');
    query.value = 'a concept';
    h.document.getElementById('search-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    h.state({ pins, query: query.value, search: [card, pack.cards[1]] });
    assert.equal(h.document.getElementById('relevant-section').hidden, true);
    assert.equal(h.document.getElementById('pinned-section').hidden, false);
    assert.equal(h.document.querySelectorAll('#search-results article').length, 1);
    const collapse = h.document.querySelector('#pinned .pin-collapse');
    collapse.focus();
    collapse.click();
    assert.equal(h.messages.at(-1).action, 'collapse');
    assert.equal(h.messages.at(-1).collapsed, true);
    const collapsedPins = [{ ...pins[0], collapsed: true }];
    h.state({ pins: collapsedPins });
    assert.equal(h.document.querySelector('#pinned code').textContent, card.code.split('\n')[0]);
    assert.equal(h.document.querySelector('#pinned .pin-collapse').getAttribute('aria-expanded'), 'false');
    assert.equal(h.document.activeElement.className, 'pin-collapse');
    h.document.getElementById('pins-toggle').click();
    assert.equal(h.messages.at(-1).action, 'collapseAll');
    h.state({ pins: collapsedPins, pinsCollapsed: true });
    assert.equal(h.document.getElementById('pinned').hidden, true);
    assert.match(h.document.getElementById('pins-toggle').textContent, /Pinned \(1\)/);
    h.document.getElementById('pins-toggle').click();
    assert.equal(h.messages.at(-1).collapsed, false);
    h.state({ pins });
    h.document.querySelector('#pinned .pin-button').click();
    assert.equal(h.messages.at(-1).action, 'unpin');
    h.state({ pins: [] });
    assert.equal(h.document.getElementById('pinned-section').hidden, true);
    assert.equal(h.document.querySelectorAll('#relevant article').length, 5);
  } finally { h.dom.window.close(); }
});

test('card count control displays the effective setting and requests changes', () => {
  const h = harness();
  try {
    const count = h.document.getElementById('card-count');
    h.state({ relevant: pack.cards.slice(0, 60) });
    assert.deepEqual([...count.options].map(option => option.value), ['5', '12', '20', '30']);
    assert.equal(count.value, '12');
    count.value = '20';
    count.dispatchEvent(new h.dom.window.Event('change'));
    assert.ok(h.messages.some(m => m.type === 'cardCount' && m.count === 20));
    h.state({ pageSize: 20, relevant: pack.cards.slice(0, 60) });
    assert.equal(count.value, '20');
    assert.equal(h.document.querySelectorAll('#relevant article').length, 20);
    h.state({ pageSize: 7 });
    assert.equal(count.value, '7', 'a custom settings value must remain visible');
    assert.equal(count.options.length, 5);
    h.state({ pageSize: 12 });
    assert.equal(count.options.length, 4);
  } finally { h.dom.window.close(); }
});

test('highlighting preserves every curated snippet and emits only token spans', () => {
  const h = harness();
  try {
    h.state({ relevant: pack.cards });
    while (!h.document.getElementById('relevant-more').hidden) {
      h.document.getElementById('relevant-more').click();
    }
    const codes = [...h.document.querySelectorAll('#relevant code')];
    assert.equal(codes.length, pack.cards.length);
    for (let n = 0; n < codes.length; n++) {
      assert.equal(codes[n].textContent, pack.cards[n].code, pack.cards[n].id);
      assert.equal(codes[n].dataset.highlighted, 'yes', pack.cards[n].id);
      for (const token of codes[n].querySelectorAll('*')) {
        assert.equal(token.tagName, 'SPAN');
        assert.ok([...token.attributes].every(a => a.name === 'class'));
      }
    }
  } finally { h.dom.window.close(); }
});

test('Rust keywords strings numbers and attributes are highlighted', () => {
  const h = harness();
  try {
    const code = '#[derive(Debug)]\nfn label<\'a>(text: &\'a str) -> usize {\n    let value = "hello";\n    42\n}';
    h.state({ relevant: [{ ...pack.cards[0], code }] });
    for (const token of ['keyword', 'string', 'number', 'meta']) {
      assert.ok(h.document.querySelector('.hljs-' + token), token);
    }
    assert.equal(h.document.querySelector('code').textContent, code);
  } finally { h.dom.window.close(); }
});

test('unknown grammars remain plain text and changed content is not cached by ID', () => {
  const h = harness();
  try {
    h.state({ languageId: 'unsupported-language', relevant: [pack.cards[0]] });
    assert.equal(h.document.querySelector('code').textContent, pack.cards[0].code);
    assert.equal(h.document.querySelectorAll('code span').length, 0);
    h.state({ relevant: [pack.cards[0]] });
    assert.ok(h.document.querySelector('code span'));
    const changed = { ...pack.cards[0], code: 'let value = "<script>alert(1)</script>";' };
    h.state({ relevant: [changed] });
    assert.equal(h.document.querySelector('code').textContent, changed.code);
    assert.equal(h.document.querySelectorAll('script').length, 0);
  } finally { h.dom.window.close(); }
});

test('search is debounced, replaces Relevant now, and restores context when cleared', async () => {
  const h = harness({ query: 'handle a missing value' });
  try {
    assert.ok(h.messages.some(m => m.type === 'ready'));
    assert.ok(h.messages.some(m => m.query === 'handle a missing value'));
    assert.equal(h.document.getElementById('relevant-section').hidden, true);
    assert.equal(h.document.getElementById('search-section').hidden, false);
    const query = h.document.getElementById('query');
    query.value = 'read without moving';
    for (let n = 0; n < 5; n++) query.dispatchEvent(new h.dom.window.Event('input'));
    const count = h.messages.filter(m => m.type === 'search').length;
    await delay(210);
    assert.equal(h.messages.filter(m => m.type === 'search').length, count + 1);
    h.state({ query: 'read without moving', search: [pack.cards.find(c => c.id === 'borrow')] });
    assert.equal(h.document.querySelectorAll('#search-results article').length, 1);
    assert.equal(h.document.querySelectorAll('#relevant article').length, 5);
    assert.equal(h.document.getElementById('search-message').hidden, true);
    assert.equal(h.document.getElementById('search-section').hidden, false);
    assert.equal(h.document.getElementById('relevant-section').hidden, true);
    h.state({ query: 'old query', search: [] });
    assert.equal(h.document.querySelectorAll('#search-results article').length, 1, 'stale state should not replace newer results');
    query.value = 'nonsense';
    h.document.getElementById('search-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    h.state({ query: 'nonsense', search: [] });
    assert.match(h.document.getElementById('search-message').textContent, /No cards for this query/);
    assert.equal(h.document.querySelectorAll('#search-results article').length, 0);
    query.value = '  ';
    query.dispatchEvent(new h.dom.window.Event('input'));
    assert.equal(h.document.getElementById('relevant-section').hidden, false, 'clearing search immediately restores context');
    assert.equal(h.document.getElementById('search-section').hidden, true);
    h.state({ query: 'nonsense', search: [] });
    assert.equal(h.document.getElementById('relevant-section').hidden, false, 'late search response must not hide context');
  } finally { h.dom.window.close(); }
});

test('code blocks override VS Code inline code background and padding', () => {
  const h = harness();
  try {
    const defaults = h.document.createElement('style');
    defaults.textContent = 'code { background-color: rgba(128, 128, 128, 0.3); padding: 0.2em; border-radius: 3px; }';
    const styles = h.document.createElement('style');
    // Resolve the inherited theme color explicitly for the DOM harness.
    styles.textContent = fs.readFileSync(require.resolve('../media/sidebar.css'), 'utf8')
      .replaceAll('var(--vscode-editor-background)', '#282a36');
    h.document.head.append(defaults, styles);
    h.state();
    const code = h.document.querySelector('code');
    const card = code.closest('article');
    const computed = h.dom.window.getComputedStyle(code);
    assert.equal(computed.backgroundColor, 'rgba(0, 0, 0, 0)');
    assert.equal(computed.padding, '0px');
    assert.equal(computed.display, 'block');
    assert.equal(h.dom.window.getComputedStyle(card).backgroundColor, 'rgb(40, 42, 54)');
  } finally { h.dom.window.close(); }
});

test('paging shows twelve initially, appends more, and resets on new context', () => {
  const h = harness();
  try {
    const cards = pack.cards.slice(0, 60);
    h.state({ relevant: cards });
    const button = h.document.getElementById('relevant-more');
    const first = h.document.querySelector('#relevant article');
    assert.equal(h.document.querySelectorAll('#relevant article').length, 12);
    assert.match(button.textContent, /12 more \(48 remaining\)/);
    button.click();
    assert.equal(h.document.querySelectorAll('#relevant article').length, 24);
    assert.equal(h.document.querySelector('#relevant article'), first);
    assert.equal(h.document.activeElement, h.document.querySelectorAll('#relevant pre')[12]);
    h.state({ relevant: cards });
    assert.equal(h.document.querySelectorAll('#relevant article').length, 24);
    h.state({ relevant: pack.cards.slice(1, 61) });
    assert.equal(h.document.querySelectorAll('#relevant article').length, 12);
    while (!button.hidden) button.click();
    assert.equal(h.document.querySelectorAll('#relevant article').length, 60);
    h.state({ relevant: cards, pageSize: 30 });
    assert.equal(h.document.querySelectorAll('#relevant article').length, 30);
    h.state({ relevant: cards, pageSize: 3 });
    assert.equal(h.document.querySelectorAll('#relevant article').length, 3);
  } finally { h.dom.window.close(); }
});

test('search paging is independent and resets even if a new query returns the same cards', () => {
  const h = harness();
  try {
    const cards = pack.cards.slice(0, 36);
    const query = h.document.getElementById('query');
    const submit = () => h.document.getElementById('search-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    query.value = 'web server';
    submit();
    h.state({ query: query.value, search: cards, relevant: cards });
    h.document.getElementById('search-more').click();
    assert.equal(h.document.querySelectorAll('#search-results article').length, 24);
    assert.equal(h.document.querySelectorAll('#relevant article').length, 12);
    h.state({ query: query.value, search: cards, relevant: cards });
    assert.equal(h.document.querySelectorAll('#search-results article').length, 24);
    query.value = 'http server';
    submit();
    h.state({ query: query.value, search: cards, relevant: cards });
    assert.equal(h.document.querySelectorAll('#search-results article').length, 12);
    query.value = '';
    submit();
    h.state({ query: '', search: [], relevant: cards });
    assert.equal(h.document.getElementById('search-section').hidden, true);
    assert.equal(h.document.getElementById('search-more').hidden, true);
  } finally { h.dom.window.close(); }
});

test('reference browses every topic without an editor and preserves context', () => {
  const h = harness();
  try {
    h.state({ reference: pack, relevant: [] });
    h.document.getElementById('reference-tab').click();
    assert.equal(h.document.getElementById('reference-section').hidden, false);
    assert.equal(h.document.getElementById('relevant-section').hidden, true);
    assert.equal(h.document.getElementById('search-form').hidden, true);
    assert.equal(h.document.querySelectorAll('#reference-topics .topic-group').length, pack.referenceGroups.length);
    assert.equal(h.document.querySelectorAll('[data-topic]').length, pack.concepts.length);
    for (const concept of pack.concepts) {
      [...h.document.querySelectorAll('[data-topic]')].find(button => button.dataset.topic === concept.id).click();
      const expected = pack.referenceTopics.find(topic => topic.id === concept.id);
      assert.deepEqual([...h.document.querySelectorAll('#reference-results code')].map(node => node.textContent), [expected.syntax], concept.id);
      assert.deepEqual([...h.document.querySelectorAll('.topic-overview li')].map(node => node.textContent), expected.rules);
      assert.equal(h.document.querySelector('.topic-overview p').textContent, expected.summary);
      assert.equal(h.document.querySelectorAll('#reference-results .card').length, 0);
      assert.equal(pack.cards.some(card => card.code === expected.syntax), false, concept.id);
    }
    h.document.getElementById('context-tab').click();
    assert.equal(h.document.getElementById('reference-section').hidden, true);
    assert.equal(h.document.getElementById('search-form').hidden, false);
    assert.equal(h.document.getElementById('relevant-section').hidden, false);
  } finally { h.dom.window.close(); }
});

test('snippet links show all related topics, including from pins and search', () => {
  const h = harness();
  try {
    const card = pack.cards.find(card => card.topics.length > 1);
    h.state({ reference: pack, relevant: [card] });
    h.document.querySelector('#relevant .reference-button').click();
    assert.equal(h.document.getElementById('reference-section').hidden, false);
    assert.equal(h.document.activeElement.id, 'reference-topic-heading');
    assert.deepEqual([...h.document.querySelectorAll('[data-topic][aria-pressed="true"]')].map(button => button.dataset.topic).sort(), [...card.topics].sort());
    h.state({ reference: pack, relevant: [card], pins: [{ languageId: 'rust', card, collapsed: true }] });
    assert.deepEqual([...h.document.querySelectorAll('#reference-results article')].map(node => node.dataset.topicId).sort(), [...card.topics].sort());
    h.document.querySelector('#pinned .reference-button').click();
    h.document.getElementById('context-tab').click();
    const query = h.document.getElementById('query');
    query.value = 'borrow';
    h.document.getElementById('search-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    h.state({ reference: pack, query: 'borrow', search: [card] });
    h.document.querySelector('#search-results .reference-button').click();
    h.document.getElementById('context-tab').click();
    assert.equal(query.value, 'borrow');
    assert.equal(h.document.getElementById('search-section').hidden, false);
  } finally { h.dom.window.close(); }
});

test('reference restores navigation and supports ungrouped packs', () => {
  const h = harness({ mode: 'reference', topics: ['iterators', 'not-a-topic'] });
  try {
    const { referenceGroups, ...legacy } = pack;
    h.state({ reference: legacy, pageSize: 3 });
    assert.equal(h.document.getElementById('reference-section').hidden, false);
    assert.equal(h.document.querySelectorAll('#reference-topics .topic-group').length, 1);
    assert.equal(h.document.querySelectorAll('#reference-results article').length, 1);
    const first = h.document.querySelector('#reference-results article');
    h.state({ reference: legacy, pageSize: 3 });
    assert.equal(h.document.querySelector('#reference-results article'), first);
    h.document.getElementById('context-tab').click();
    assert.ok(h.messages.some(message => message.saved?.topics?.join() === 'iterators'));
  } finally { h.dom.window.close(); }
});

test('overview content renders as safe text and missing content does not substitute snippets', () => {
  const h = harness({ mode: 'reference', topics: ['loops'] });
  try {
    const overview = { id: 'loops', title: '<img src=x>', summary: '<script>bad()</script>', syntax: 'loop { break; }', rules: ['<img src=x onerror=bad()>'] };
    h.state({ reference: { ...pack, referenceTopics: [overview] } });
    assert.equal(h.document.querySelector('.topic-overview h3').textContent, overview.title);
    assert.equal(h.document.querySelector('.topic-overview p').textContent, overview.summary);
    assert.equal(h.document.querySelector('.topic-overview li').textContent, overview.rules[0]);
    assert.equal(h.document.querySelectorAll('img, script').length, 0);
    const { referenceTopics, ...legacy } = pack;
    h.state({ reference: legacy });
    assert.match(h.document.querySelector('.topic-overview p').textContent, /not available/);
    assert.equal(h.document.querySelectorAll('#reference-results code').length, 0);
  } finally { h.dom.window.close(); }
});

test('every topic is directly available in Reference before and after selection', () => {
  const h = harness();
  try {
    h.state({ reference: pack });
    h.document.getElementById('reference-tab').click();
    const nav = h.document.getElementById('reference-navigation');
    assert.equal(nav.closest('[hidden]'), null);
    assert.equal(nav.querySelectorAll('details, summary').length, 0);
    const buttons = [...nav.querySelectorAll('[data-topic]')];
    assert.equal(buttons.length, pack.concepts.length);
    assert.ok(buttons.every(button => !button.closest('[hidden]')));
    buttons.find(button => button.dataset.topic === 'loops').click();
    assert.equal(h.document.querySelector('.topic-overview').dataset.topicId, 'loops');
    assert.equal(nav.closest('[hidden]'), null);
    assert.equal(nav.querySelectorAll('[data-topic]').length, pack.concepts.length);
    h.document.querySelector('[data-topic="option"]').click();
    assert.equal(h.document.querySelector('.topic-overview').dataset.topicId, 'option');
  } finally { h.dom.window.close(); }
});

test('compact quick references show separate syntax, open full overviews and follow the active query', () => {
  const h = harness();
  try {
    h.state({ reference: pack, suggestedTopics: ['loops', 'loops', 'option', 'strings', 'unknown'] });
    const section = h.document.getElementById('suggested-topics-section');
    assert.equal(section.hidden, false);
    assert.deepEqual([...section.querySelectorAll('button')].map(button => button.textContent), ['Loops', 'Option']);
    assert.deepEqual([...section.querySelectorAll('code')].map(code => code.textContent), ['loops', 'option'].map(id => pack.referenceTopics.find(topic => topic.id === id).syntax));
    assert.ok(section.querySelector('.hljs-keyword'));
    assert.equal(section.querySelectorAll('.pin-button').length, 0);
    assert.equal(h.document.querySelectorAll('#relevant .card').length, 5, 'references do not consume the example budget');
    const first = section.querySelector('article');
    h.state({ reference: pack, suggestedTopics: ['loops', 'option'] });
    assert.equal(section.querySelector('article'), first, 'unchanged previews preserve scroll and focus');
    section.querySelector('button').click();
    assert.equal(h.document.getElementById('reference-section').hidden, false);
    assert.equal(h.document.querySelector('.topic-overview').dataset.topicId, 'loops');
    assert.equal(section.hidden, true);
    h.document.getElementById('context-tab').click();
    assert.equal(section.hidden, false);
    const query = h.document.getElementById('query');
    query.value = 'borrow';
    h.document.getElementById('search-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    assert.equal(section.hidden, true, 'cursor references disappear while a different search is pending');
    h.state({ reference: pack, suggestedTopics: ['loops'], searchTopics: ['option'], query: 'borrow', search: [pack.cards[0]] });
    section.querySelector('button').click();
    assert.equal(h.document.querySelector('.topic-overview').dataset.topicId, 'option');
    h.document.getElementById('context-tab').click();
    assert.equal(query.value, 'borrow');
    assert.equal(h.document.getElementById('search-section').hidden, false);
    query.value = 'new query';
    query.dispatchEvent(new h.dom.window.Event('input'));
    h.state({ reference: pack, query: 'borrow', searchTopics: ['strings'] });
    assert.equal(section.hidden, true, 'late results cannot show references for a stale query');
    query.value = '';
    query.dispatchEvent(new h.dom.window.Event('input'));
    h.state({ reference: pack, suggestedTopics: [] });
    assert.equal(section.hidden, true);
  } finally { h.dom.window.close(); }
});

test('reference-only searches explain missing examples and escape preview content', () => {
  const h = harness();
  try {
    const query = h.document.getElementById('query');
    query.value = 'special syntax';
    h.document.getElementById('search-form').dispatchEvent(new h.dom.window.Event('submit', { cancelable: true }));
    const topic = { ...pack.referenceTopics[0], syntax: '<img src=x onerror=bad()>', title: '<script>bad()</script>' };
    h.state({ reference: { ...pack, referenceTopics: [topic] }, query: query.value, search: [], searchTopics: [topic.id] });
    assert.equal(h.document.querySelector('#suggested-topics code').textContent, topic.syntax);
    assert.equal(h.document.querySelectorAll('img, script').length, 0);
    assert.equal(h.document.getElementById('search-message').hidden, false);
    assert.match(h.document.getElementById('search-message').textContent, /No example snippets/);
    h.document.querySelector('#suggested-topics button').click();
    assert.equal(h.document.querySelector('#reference-results code').textContent, topic.syntax);
  } finally { h.dom.window.close(); }
});

test('Go highlighting and reference navigation replace Rust topics on language switch', () => {
  const h = harness();
  const goPack = { ...require('../packs/go.json'), referenceTopics: require('../packs/go-reference.json') };
  try {
    h.state({ reference: pack });
    h.document.getElementById('reference-tab').click();
    h.document.querySelector('[data-topic="ownership"]')?.click();
    h.state({ languageId: 'go', language: 'Go', reference: goPack, relevant: goPack.cards, suggestedTopics: ['maps'] });
    assert.equal(h.document.querySelector('#suggested-topics code').textContent, goPack.referenceTopics.find(topic => topic.id === 'maps').syntax);
    assert.ok(h.document.querySelector('#suggested-topics code').classList.contains('language-go'));
    assert.equal(h.document.getElementById('language').textContent, 'Go');
    assert.match(h.document.getElementById('reference-heading').textContent, /Go/);
    assert.equal(h.document.querySelectorAll('[data-topic]').length, goPack.concepts.length);
    for (const topic of goPack.referenceTopics) {
      h.document.querySelector(`[data-topic="${topic.id}"]`).click();
      assert.equal(h.document.querySelector('#reference-results code').textContent, topic.syntax);
    }
    h.document.getElementById('context-tab').click();
    for (const code of h.document.querySelectorAll('#relevant code')) {
      assert.ok(code.classList.contains('language-go'));
      assert.ok(code.querySelector('[class^=hljs-]'));
    }
    assert.ok(h.document.querySelector('#relevant .hljs-keyword'));
    h.state({ reference: pack });
    assert.equal(h.document.querySelectorAll('#suggested-topics code').length, 0);
    assert.equal(h.document.querySelectorAll('[data-topic]').length, pack.concepts.length);
    assert.equal(h.document.querySelectorAll('#reference-results code').length, 0);
  } finally { h.dom.window.close(); }
});

test('TypeScript renders highlighted examples, pinned cards and every dedicated overview', () => {
  const h = harness();
  const tsPack = { ...require('../packs/typescript.json'), referenceTopics: require('../packs/typescript-reference.json') };
  try {
    const pinned = tsPack.cards.find(card => card.id === 'satisfies');
    h.state({ languageId: 'typescript', language: 'TypeScript', reference: tsPack, pageSize: 30,
      relevant: tsPack.cards, suggestedTopics: ['async'], pins: [{ languageId: 'typescript', card: pinned, collapsed: false }] });
    assert.equal(h.document.getElementById('language').textContent, 'TypeScript');
    assert.equal(h.document.querySelector('#suggested-topics code').textContent, tsPack.referenceTopics.find(topic => topic.id === 'async').syntax);
    while (!h.document.getElementById('relevant-more').hidden) h.document.getElementById('relevant-more').click();
    assert.equal(h.document.querySelectorAll('#relevant code, #pinned code').length, tsPack.cards.length);
    for (const code of h.document.querySelectorAll('#relevant code, #pinned code')) {
      assert.ok(code.classList.contains('language-typescript'));
      assert.ok(code.querySelector('[class^=hljs-]'));
      assert.ok(tsPack.cards.some(card => card.code === code.textContent));
    }
    h.document.getElementById('reference-tab').click();
    assert.equal(h.document.querySelectorAll('[data-topic]').length, tsPack.concepts.length);
    for (const topic of tsPack.referenceTopics) {
      h.document.querySelector(`[data-topic="${topic.id}"]`).click();
      assert.equal(h.document.querySelector('#reference-results code').textContent, topic.syntax);
      assert.ok(h.document.querySelector('#reference-results code').classList.contains('language-typescript'));
    }
    h.state({ reference: pack });
    assert.equal(h.document.querySelectorAll('[data-topic]').length, pack.concepts.length);
    assert.equal(h.document.querySelectorAll('#suggested-topics code').length, 0);
  } finally { h.dom.window.close(); }
});

test('topic search filters names and aliases without changing the current overview or context query', () => {
  const h = harness({ mode: 'reference', topics: ['loops'], query: 'borrow' });
  try {
    h.state({ reference: pack, query: 'borrow' });
    const input = h.document.getElementById('topic-query');
    const filter = text => { input.value = text; input.dispatchEvent(new h.dom.window.Event('input')); };
    const overview = h.document.querySelector('.topic-overview');
    filter('missing value');
    assert.ok(h.document.querySelector('[data-topic="option"]'));
    assert.equal(h.document.querySelector('.topic-overview'), overview);
    assert.equal(h.document.getElementById('query').value, 'borrow');
    filter('NO SUCH TOPIC');
    assert.equal(h.document.querySelectorAll('[data-topic]').length, 0);
    assert.equal(h.document.getElementById('topic-search-message').hidden, false);
    input.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(h.document.querySelectorAll('[data-topic]').length, pack.concepts.length);
    filter('LOOPS');
    input.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Enter' }));
    assert.equal(h.document.querySelector('.topic-overview').dataset.topicId, 'loops');
    assert.ok(h.messages.some(message => message.saved?.topicQuery === 'LOOPS'));
  } finally { h.dom.window.close(); }
});

test('Cargo snippets and overviews highlight as TOML and retain Rust pins and plain copied text', () => {
  const h = harness();
  try {
    const card = pack.cards.find(card => card.id === 'cargo-workspace');
    h.state({ reference: pack, relevant: [card], suggestedTopics: ['cargo-workspaces'] });
    const code = h.document.querySelector('#relevant code');
    assert.equal(code.classList.contains('language-toml'), true);
    assert.equal(code.textContent, card.code);
    assert.ok(code.querySelector('.hljs-section'));
    assert.equal(h.document.querySelector('.quick-reference code').classList.contains('language-toml'), true);
    h.document.querySelector('#relevant .pin-button').click();
    assert.deepEqual(JSON.parse(JSON.stringify(h.messages.at(-1))), { type: 'pin', action: 'pin', languageId: 'rust', cardId: card.id });
    h.state({ reference: pack, relevant: [], pins: [{ languageId: 'rust', card, collapsed: false }] });
    assert.equal(h.document.querySelector('#pinned code').classList.contains('language-toml'), true);
    assert.equal(h.document.querySelector('#pinned code').textContent, card.code);
    h.document.querySelector('#pinned .reference-button').click();
    assert.equal(h.document.querySelector('#reference-results code').classList.contains('language-toml'), true);
  } finally { h.dom.window.close(); }
});

test('terminal catalog renders every overview and highlights shell examples without altering copy text', () => {
  const h = harness();
  const shellPack = { ...require('../packs/shellscript.json'), referenceTopics: require('../packs/shellscript-reference.json') };
  try {
    h.state({ languageId: 'shellscript', language: 'Terminal', reference: shellPack, relevant: shellPack.cards, suggestedTopics: ['cargo-test'] });
    assert.equal(h.document.getElementById('language').textContent, 'Terminal');
    const codes = [...h.document.querySelectorAll('#relevant code')];
    for (const [index, code] of codes.entries()) {
      assert.equal(code.textContent, shellPack.cards[index].code);
      assert.ok(code.classList.contains('language-shellscript'));
    }
    assert.ok(h.document.querySelector('#relevant [class^="hljs-"]'));
    h.document.getElementById('reference-tab').click();
    assert.equal(h.document.querySelectorAll('[data-topic]').length, shellPack.concepts.length);
    for (const topic of shellPack.referenceTopics) {
      h.document.querySelector(`[data-topic="${topic.id}"]`).click();
      assert.equal(h.document.querySelector('#reference-results code').textContent, topic.syntax);
    }
  } finally { h.dom.window.close(); }
});
