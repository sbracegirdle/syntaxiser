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

  // One shared overlay stays outside the cards so opening it never changes their layout.
  const explanation = document.createElement('aside');
  explanation.id = 'explanation';
  explanation.className = 'explanation';
  explanation.hidden = true;
  explanation.setAttribute('role', 'dialog');
  explanation.setAttribute('aria-modal', 'false');
  explanation.setAttribute('aria-labelledby', 'explanation-heading');
  explanation.setAttribute('aria-describedby', 'explanation-text');
  const explanationHeader = document.createElement('div');
  explanationHeader.className = 'explanation-header';
  const explanationHeading = document.createElement('span');
  explanationHeading.id = 'explanation-heading';
  const explanationClose = document.createElement('button');
  explanationClose.type = 'button';
  explanationClose.className = 'explanation-close';
  explanationClose.setAttribute('aria-label', 'Close explanation');
  explanationClose.textContent = '×';
  const explanationText = document.createElement('p');
  explanationText.id = 'explanation-text';
  explanationHeader.append(explanationHeading, explanationClose);
  explanation.append(explanationHeader, explanationText);
  document.body.appendChild(explanation);
  let explanationOwner;
  let explanationLocked = false;
  let hoverTimer;
  let dismissTimer;

  function hideExplanation(restoreFocus = false) {
    clearTimeout(hoverTimer);
    hoverTimer = undefined;
    clearTimeout(dismissTimer);
    const owner = explanationOwner;
    explanationOwner = undefined;
    explanationLocked = false;
    explanation.hidden = true;
    owner?.button.setAttribute('aria-expanded', 'false');
    if (restoreFocus && owner?.button.isConnected) owner.button.focus();
  }

  function positionExplanation() {
    if (!explanationOwner) return;
    const anchor = explanationOwner.pre.getBoundingClientRect();
    const popup = explanation.getBoundingClientRect();
    const margin = 12;
    const gap = 6;
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    const below = anchor.bottom + gap;
    const above = anchor.top - popup.height - gap;
    const top = below + popup.height <= viewportHeight - margin ? below : above;
    explanation.style.left = Math.max(margin, Math.min(anchor.left, viewportWidth - popup.width - margin)) + 'px';
    explanation.style.top = Math.max(margin, Math.min(top, viewportHeight - popup.height - margin)) + 'px';
  }

  function showExplanation(owner, locked = false) {
    clearTimeout(hoverTimer);
    hoverTimer = undefined;
    clearTimeout(dismissTimer);
    if (!owner.article.isConnected || owner.article.closest('[hidden]')) return;
    if (explanationLocked && !locked) return;
    explanationOwner?.button.setAttribute('aria-expanded', 'false');
    explanationOwner = owner;
    explanationLocked = locked;
    explanationHeading.textContent = owner.card.title;
    explanationText.textContent = owner.card.explanation;
    explanationText.scrollTop = 0;
    explanation.hidden = false;
    owner.button.setAttribute('aria-expanded', 'true');
    positionExplanation();
  }

  function hoverExplanation(owner) {
    clearTimeout(hoverTimer);
    clearTimeout(dismissTimer);
    if (explanationLocked || window.getSelection()?.isCollapsed === false) return;
    hoverTimer = setTimeout(() => showExplanation(owner), 450);
  }

  function leaveExplanation() {
    clearTimeout(hoverTimer);
    hoverTimer = undefined;
    clearTimeout(dismissTimer);
    if (!explanationLocked) dismissTimer = setTimeout(() => hideExplanation(), 180);
  }

  explanation.addEventListener('pointerenter', () => clearTimeout(dismissTimer));
  explanation.addEventListener('pointerleave', leaveExplanation);
  explanation.addEventListener('focusin', () => clearTimeout(dismissTimer));
  explanation.addEventListener('focusout', event => {
    if (!explanation.contains(event.relatedTarget)) leaveExplanation();
  });
  explanationClose.addEventListener('click', () => hideExplanation(true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && (!explanation.hidden || hoverTimer)) {
      const restoreFocus = explanation.contains(document.activeElement);
      hideExplanation(restoreFocus);
      event.preventDefault();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!explanation.contains(event.target) && !explanationOwner?.button.contains(event.target)) hideExplanation();
  });
  document.addEventListener('focusin', event => {
    if (!explanation.contains(event.target) && !explanationOwner?.button.contains(event.target)) hideExplanation();
  });
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection?.isCollapsed === false && !explanation.contains(selection.anchorNode)) hideExplanation();
  });
  document.addEventListener('scroll', event => {
    if (!explanation.contains(event.target)) hideExplanation();
  }, true);
  window.addEventListener('resize', () => hideExplanation());
  window.addEventListener('blur', () => hideExplanation());

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
      pre.setAttribute('aria-label', card.title);
      pre.setAttribute('aria-description', card.explanation);
      const info = document.createElement('button');
      info.type = 'button';
      info.className = 'info-button';
      info.setAttribute('aria-label', 'Explain ' + card.title);
      info.setAttribute('aria-haspopup', 'dialog');
      info.setAttribute('aria-controls', explanation.id);
      info.setAttribute('aria-expanded', 'false');
      const infoIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      infoIcon.setAttribute('viewBox', '0 0 24 24');
      infoIcon.setAttribute('aria-hidden', 'true');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '9');
      const mark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      mark.setAttribute('d', 'M12 11v6M12 7h.01');
      infoIcon.append(circle, mark);
      info.appendChild(infoIcon);
      tools.insertBefore(info, tools.firstChild);
      const owner = { article, pre, button: info, card };
      for (const target of [pre, info]) {
        target.addEventListener('pointerenter', () => hoverExplanation(owner));
        target.addEventListener('pointerleave', leaveExplanation);
        target.addEventListener('blur', leaveExplanation);
      }
      info.addEventListener('click', event => {
        if (explanationOwner === owner && explanationLocked) hideExplanation();
        else {
          showExplanation(owner, true);
          if (event.detail === 0) explanationClose.focus();
        }
      });
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
    hideExplanation();
    vscode.setState({ query: query.value });
    vscode.postMessage({ type: 'search', query: value });
  }
  query.addEventListener('input', () => {
    hideExplanation();
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
    if (explanationOwner && (!explanationOwner.article.isConnected || explanationOwner.article.closest('[hidden]'))) hideExplanation();
    if (focusedKey && !active.isConnected) {
      const visibleCards = [
        ...(!pinsCollapsed ? document.querySelectorAll('#pinned .card') : []),
        ...document.querySelectorAll(query.value.trim() ? '#search-results .card' : '#relevant .card'),
      ];
      const card = visibleCards.find(card => card.dataset.pinKey === focusedKey);
      const control = active.className === 'pin-collapse' ? '.pin-collapse' : active.className === 'info-button'
        ? '.info-button' : active.tagName === 'PRE' ? 'pre' : '.pin-button';
      const target = card?.querySelector(control) ?? (pins.length ? document.getElementById('pins-toggle')
        : visibleCards[0]?.querySelector('.pin-button') ?? query);
      target.focus();
    }
  });
  vscode.postMessage({ type: 'ready' });
  if (query.value) search();
})();
