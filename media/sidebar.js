(function () {
  'use strict';
  const vscode = acquireVsCodeApi();
  const query = document.getElementById('query');
  const cardCount = document.getElementById('card-count');
  const saved = vscode.getState();
  let timer;
  let renderedQuery = '';
  let pageSize = 12;
  let relevantLanguageId = 'rust';
  let searchLanguageId = 'rust';
  let searchQuery = '';
  let pins = [];
  let pinsCollapsed = false;
  let lastState;
  const pinKey = (languageId, cardId) => JSON.stringify([languageId, cardId]);
  const pinMessage = action => vscode.postMessage({ type: 'pin', ...action });
  document.getElementById('pins-toggle').addEventListener('click', () => {
    pinMessage({ action: 'collapseAll', collapsed: !pinsCollapsed });
  });
  const groups = {
    relevant: { cards: [], shown: pageSize, signature: '', button: document.getElementById('relevant-more') },
    'search-results': { cards: [], shown: pageSize, signature: '', button: document.getElementById('search-more') },
  };
  if (saved && typeof saved.query === 'string') query.value = saved.query.slice(0, 300);
  function syncSections() {
    const searching = !!query.value.trim();
    document.getElementById('search-section').hidden = !searching;
    document.getElementById('relevant-section').hidden = searching;
  }
  syncSections();
  cardCount.addEventListener('change', () => {
    vscode.postMessage({ type: 'cardCount', count: Number(cardCount.value) });
  });

  function createCard(card, languageId, pin) {
    const article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('aria-label', card.title);
    article.dataset.pinKey = pinKey(languageId, card.id);
    const tools = document.createElement('div');
    tools.className = 'card-tools';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pin-button';
    button.title = pin ? 'Unpin card' : 'Pin card';
    button.setAttribute('aria-label', (pin ? 'Unpin ' : 'Pin ') + card.title);
    button.setAttribute('aria-pressed', String(!!pin));
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M8 3h8M9 3v6l-3 4v2h12v-2l-3-4V3M12 15v6');
    icon.appendChild(path);
    button.appendChild(icon);
    button.addEventListener('click', () => pinMessage({ action: pin ? 'unpin' : 'pin', languageId, cardId: card.id }));
    if (pin) {
      const collapse = document.createElement('button');
      collapse.type = 'button';
      collapse.className = 'pin-collapse';
      collapse.textContent = pin.collapsed ? '▸' : '▾';
      collapse.title = pin.collapsed ? 'Expand pinned card' : 'Collapse pinned card';
      collapse.setAttribute('aria-label', collapse.title + ': ' + card.title);
      collapse.setAttribute('aria-expanded', String(!pin.collapsed));
      collapse.addEventListener('click', () => pinMessage({ action: 'collapse', languageId, cardId: card.id, collapsed: !pin.collapsed }));
      tools.appendChild(collapse);
    }
    tools.appendChild(button);
    const pre = document.createElement('pre');
    pre.tabIndex = 0;
    if (typeof card.explanation === 'string' && card.explanation.trim()) {
      // Native tooltips add no visible content or layout, including on collapsed pins.
      pre.title = card.explanation;
      pre.setAttribute('aria-label', card.title);
      pre.setAttribute('aria-description', card.explanation);
    }
    if (pin?.collapsed) pre.className = 'pin-preview';
    const code = document.createElement('code');
    code.textContent = pin?.collapsed ? card.code.split('\n')[0] : card.code;
    if (window.SyntaxiserHighlight) window.SyntaxiserHighlight.highlight(code, languageId);
    pre.appendChild(code);
    article.append(tools, pre);
    return article;
  }

  function renderPins() {
    const container = document.getElementById('pinned');
    document.getElementById('pinned-section').hidden = pins.length === 0;
    container.hidden = pinsCollapsed;
    const toggle = document.getElementById('pins-toggle');
    toggle.textContent = (pinsCollapsed ? '▸' : '▾') + ' Pinned (' + pins.length + ')';
    toggle.setAttribute('aria-expanded', String(!pinsCollapsed));
    const signature = JSON.stringify(pins);
    if (container.dataset.signature === signature) return;
    container.dataset.signature = signature;
    container.replaceChildren(...pins.map(pin => createCard(pin.card, pin.languageId, pin)));
  }

  function renderCards(id, cards, languageId, reset = false) {
    const container = document.getElementById(id);
    const group = groups[id];
    const signature = JSON.stringify([languageId, cards.map(card => [card.id, card.code, card.title, card.explanation])]);
    const cardsChanged = group.signature !== signature;
    if (reset || cardsChanged) group.shown = pageSize;
    group.signature = signature;
    group.cards = cards;
    const visible = cards.slice(0, group.shown);
    const visibleSignature = JSON.stringify([signature, group.shown]);
    group.button.hidden = cards.length <= group.shown;
    group.button.textContent = 'Show ' + Math.min(pageSize, Math.max(0, cards.length - group.shown))
      + ' more (' + Math.max(0, cards.length - group.shown) + ' remaining)';
    if (container.dataset.signature === visibleSignature) return;
    container.dataset.signature = visibleSignature;
    const append = !reset && !cardsChanged;
    const start = append ? container.childElementCount : 0;
    const nodes = visible.slice(start).map(card => createCard(card, languageId));
    if (append) container.append(...nodes);
    else container.replaceChildren(...nodes);
  }

  function expand(id, languageId) {
    const container = document.getElementById(id);
    const firstNew = container.childElementCount;
    groups[id].shown += pageSize;
    renderCards(id, groups[id].cards, languageId);
    const next = container.children[firstNew];
    if (next) next.querySelector('pre').focus();
  }
  groups.relevant.button.addEventListener('click', () => expand('relevant', relevantLanguageId));
  groups['search-results'].button.addEventListener('click', () => expand('search-results', searchLanguageId));

  function search() {
    const value = query.value.trim();
    renderedQuery = value;
    syncSections();
    vscode.setState({ query: query.value });
    vscode.postMessage({ type: 'search', query: value });
  }
  query.addEventListener('input', () => {
    syncSections();
    clearTimeout(timer);
    timer = setTimeout(search, 180);
  });
  document.getElementById('search-form').addEventListener('submit', event => {
    event.preventDefault(); clearTimeout(timer); search();
  });
  window.addEventListener('message', event => {
    const state = event.data;
    if (!state || state.type !== 'state') return;
    const active = document.activeElement;
    const focusedKey = active?.closest('.card')?.dataset.pinKey;
    const pinsChanged = JSON.stringify(pins) !== JSON.stringify(state.pins ?? []);
    pins = state.pins ?? [];
    pinsCollapsed = state.pinsCollapsed === true;
    renderPins();
    const nextPageSize = Number.isFinite(state.pageSize) ? Math.max(3, Math.min(30, Math.round(state.pageSize))) : 12;
    const pageSizeChanged = nextPageSize !== pageSize;
    pageSize = nextPageSize;
    cardCount.querySelector('[data-custom]')?.remove();
    if (![...cardCount.options].some(option => option.value === String(pageSize))) {
      const option = document.createElement('option');
      option.value = String(pageSize);
      option.textContent = pageSize + ' cards';
      option.dataset.custom = 'true';
      cardCount.appendChild(option);
    }
    cardCount.value = String(pageSize);
    document.getElementById('language').textContent = state.language;
    document.getElementById('scope').textContent = state.scope === 'module' ? 'FILE SCOPE'
      : state.scope ? state.scope.toUpperCase() : '';
    const contextMessage = document.getElementById('context-message');
    contextMessage.textContent = state.message;
    contextMessage.hidden = !state.message;
    relevantLanguageId = state.languageId;
    const keys = new Set(pins.map(pin => pinKey(pin.languageId, pin.card.id)));
    const unpinned = (cards, languageId) => cards.filter(card => !keys.has(pinKey(languageId, card.id)));
    renderCards('relevant', unpinned(state.relevant, relevantLanguageId), relevantLanguageId, pageSizeChanged);
    // Automatic editor updates should not overwrite a newer search being typed.
    if (state.query === renderedQuery && state.query === query.value.trim()) {
      const queryChanged = state.query !== searchQuery;
      searchQuery = state.query;
      searchLanguageId = state.languageId;
      renderCards('search-results', unpinned(state.search, searchLanguageId), searchLanguageId, queryChanged || pageSizeChanged);
      const message = document.getElementById('search-message');
      message.textContent = !state.query ? 'Search by syntax or what you want to remember.'
        : !state.search.length ? 'No cards for this query yet. Try a language concept or library name.' : '';
      message.hidden = !!state.search.length;
      lastState = state;
    } else if (pinsChanged && lastState) {
      // Pin changes can arrive while another query is being typed; keep the last
      // accepted search results consistent without accepting a stale query.
      renderCards('search-results', unpinned(lastState.search, searchLanguageId), searchLanguageId);
    }
    syncSections();
    if (focusedKey && !active.isConnected) {
      const visibleCards = [
        ...(!pinsCollapsed ? document.querySelectorAll('#pinned .card') : []),
        ...document.querySelectorAll(query.value.trim() ? '#search-results .card' : '#relevant .card'),
      ];
      const card = visibleCards.find(card => card.dataset.pinKey === focusedKey);
      const control = active.className === 'pin-collapse' ? '.pin-collapse' : active.tagName === 'PRE' ? 'pre' : '.pin-button';
      const target = card?.querySelector(control) ?? (pins.length ? document.getElementById('pins-toggle')
        : visibleCards[0]?.querySelector('.pin-button') ?? query);
      target.focus();
    }
  });
  vscode.postMessage({ type: 'ready' });
  if (query.value) search();
})();
