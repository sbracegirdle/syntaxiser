const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const pack = require('../packs/rust.json');

const html = `<!doctype html><html><body>
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
  dom.window.eval(script);
  const state = patch => dom.window.dispatchEvent(new dom.window.MessageEvent('message', { data: {
    type: 'state', languageId: 'rust', language: 'Rust', scope: 'module', pageSize: 12, relevant: pack.cards.slice(0, 5), search: [], query: '', message: '', pins: [], pinsCollapsed: false, ...patch,
  } }));
  return { dom, document: dom.window.document, messages, state };
}

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
