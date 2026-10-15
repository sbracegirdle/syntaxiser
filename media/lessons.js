(function () {
  'use strict';
  window.SyntaxiserLessons = function (vscode, saved, save) {
    const get = id => document.getElementById(id);
    const difficulty = get('lesson-difficulty');
    const status = get('lesson-status');
    const order = get('lesson-order');
    const hideDone = get('lesson-hide-done');
    const form = get('lesson-form');
    const fields = { title: get('lesson-title'), instructions: get('lesson-instructions') };
    const labels = { todo: 'To do', 'in-progress': 'In progress', done: 'Done' };
    const stateLabels = { todo: '◇ To do', 'in-progress': '◔ In progress', done: '✓ Done', hidden: '⊘ Hidden' };
    const levels = ['First steps', 'Beginner', 'Intermediate', 'Advanced', 'Challenging'];
    let languageId = '';
    let libraries = [];
    let signature = '';
    let browserMode = false;
    let browserSelectionKey = '';
    const selections = new Map(Object.entries(saved?.lessonSelections && typeof saved.lessonSelections === 'object' ? saved.lessonSelections : {})
      .filter(([language, id]) => language.length <= 100 && typeof id === 'string' && id.length <= 200));
    let editing;
    let formLanguage;
    let formDifficulty;
    let sortOrder = saved?.lessonOrder === 'hard' ? 'hard' : 'easy';
    let hideCompleted = saved?.lessonHideDone !== false && saved?.lessonStatus !== 'done';
    const expanded = new Set();
    let bodyId = 0;
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(entries => {
      for (const entry of entries) measureBody(entry.target);
    });
    for (const [control, value] of [[difficulty, saved?.lessonDifficulty], [status, saved?.lessonStatus]]) {
      if ([...control.options].some(option => option.value === value)) control.value = value;
    }
    const message = action => vscode.postMessage({ type: 'lesson', languageId, ...action });
    const library = () => libraries.find(item => item.languageId === languageId);
    const button = (text, onClick) => {
      const node = document.createElement('button');
      node.type = 'button'; node.textContent = text;
      node.addEventListener('click', onClick);
      return node;
    };
    function closeForm() { form.hidden = true; editing = undefined; get('lesson-new').focus(); }
    function openForm(lesson) {
      form.reset();
      editing = lesson;
      formLanguage = languageId;
      formDifficulty = lesson?.difficulty ?? (Number(difficulty.value) || 1);
      get('lesson-form-heading').textContent = (lesson ? 'Edit lesson · ' : 'New lesson · ') + library().language + ' · Level ' + formDifficulty;
      get('lesson-form-message').textContent = '';
      if (lesson) for (const [key, field] of Object.entries(fields)) field.value = String(lesson[key]);
      form.hidden = false;
      fields.title.focus();
    }
    get('lesson-new').addEventListener('click', () => openForm());
    get('lesson-cancel').addEventListener('click', closeForm);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (![fields.title, fields.instructions].every(field => field.value.trim())) {
        get('lesson-form-message').textContent = 'Add a title and description.';
        return;
      }
      message({ action: 'save', languageId: formLanguage, id: editing?.id, lesson: {
        title: fields.title.value.trim(), difficulty: formDifficulty, instructions: fields.instructions.value.trim(),
        starter: editing?.starter ?? '', check: editing?.check ?? '',
      } });
      closeForm();
    });
    for (const control of [difficulty, status]) control.addEventListener('change', () => {
      if (control === status && status.value === 'done') hideCompleted = false;
      render(); save();
    });
    order.addEventListener('click', () => { sortOrder = sortOrder === 'hard' ? 'easy' : 'hard'; render(); save(); });
    hideDone.addEventListener('click', () => {
      hideCompleted = !hideCompleted;
      if (hideCompleted && status.value === 'done') status.value = 'all';
      render(); save();
    });
    get('lesson-reset-language').addEventListener('click', () => message({ action: 'reset', all: false }));
    get('lesson-reset-all').addEventListener('click', () => message({ action: 'reset', all: true }));

    function createLessonCard(lesson, full = false) {
      const card = document.createElement('div'); card.className = 'lesson-card'; card.dataset.id = lesson.id;
      card.dataset.status = lesson.status;
      card.dataset.custom = String(lesson.custom);
      const key = JSON.stringify([languageId, lesson.id]);
      const title = document.createElement('h3'); title.textContent = lesson.title;
      const header = document.createElement('div'); header.className = 'lesson-header';
      header.appendChild(title);
      if (stateLabels[lesson.status]) {
        const stateLabel = document.createElement('span'); stateLabel.className = 'lesson-state';
        stateLabel.textContent = stateLabels[lesson.status]; header.appendChild(stateLabel);
      }
      const hidden = lesson.status === 'hidden';
      const hide = button(hidden ? '↶' : '⊘', () => message({ action: 'status', id: lesson.id, status: hidden ? 'untracked' : 'hidden' }));
      hide.className = 'lesson-hide';
      hide.title = hidden ? 'Restore lesson' : 'Hide lesson';
      hide.setAttribute('aria-label', hide.title + ': ' + lesson.title);
      header.appendChild(hide);
      const badge = document.createElement('small'); badge.textContent = `${lesson.difficulty} · ${levels[lesson.difficulty - 1]}`;
      if (lesson.custom) {
        const origin = document.createElement('span'); origin.className = 'lesson-origin'; origin.textContent = 'Your lesson';
        badge.append(' · ', origin);
      }
      const body = document.createElement('div'); body.id = `lesson-body-${++bodyId}`;
      body.className = 'lesson-body' + (full || expanded.has(key) ? ' expanded' : '');
      const instructions = document.createElement('p'); instructions.textContent = lesson.instructions;
      body.appendChild(instructions);
      if (lesson.starter) {
        const pre = document.createElement('pre'); pre.tabIndex = 0;
        const code = document.createElement('code'); code.textContent = lesson.starter;
        window.SyntaxiserHighlight?.highlight(code, languageId);
        pre.appendChild(code); body.appendChild(pre);
      }
      if (lesson.check) {
        const check = document.createElement('p'); check.className = 'lesson-check';
        const checkLabel = document.createElement('strong'); checkLabel.textContent = 'Check your work: ';
        check.append(checkLabel, lesson.check); body.appendChild(check);
      }
      const more = button(expanded.has(key) ? 'Show less' : 'Show more', () => {
        if (expanded.has(key)) expanded.delete(key); else expanded.add(key);
        body.classList.toggle('expanded', expanded.has(key));
        more.textContent = expanded.has(key) ? 'Show less' : 'Show more';
        more.setAttribute('aria-expanded', String(expanded.has(key)));
        measureBody(body);
      });
      more.className = 'lesson-more'; more.hidden = true;
      more.setAttribute('aria-expanded', String(expanded.has(key)));
      more.setAttribute('aria-controls', body.id);
      const tools = document.createElement('div'); tools.className = 'lesson-tools';
      for (const [value, label] of Object.entries(labels)) {
        const selected = lesson.status === value;
        const progress = button(label, () => message({ action: 'status', id: lesson.id, status: selected ? 'untracked' : value }));
        progress.className = 'lesson-progress'; progress.dataset.status = value;
        progress.setAttribute('aria-pressed', String(selected));
        progress.setAttribute('aria-label', (selected ? 'Untrack ' : `Mark ${label.toLowerCase()}: `) + lesson.title);
        progress.title = selected ? 'Click again to stop tracking' : `Mark ${label.toLowerCase()}`;
        tools.appendChild(progress);
      }
      if (lesson.custom) {
        const edit = button('Edit', () => openForm(lesson)); edit.className = 'lesson-edit';
        edit.setAttribute('aria-label', 'Edit ' + lesson.title);
        const remove = button('Delete…', () => message({ action: 'delete', id: lesson.id })); remove.className = 'lesson-delete';
        remove.setAttribute('aria-label', 'Delete ' + lesson.title);
        tools.append(edit, remove);
      }
      card.append(header, badge, body);
      if (!full) card.appendChild(more);
      card.appendChild(tools);
      return card;
    }

    function measureBody(body) {
      const more = body.parentElement.querySelector('.lesson-more');
      if (!more) return;
      more.hidden = !body.classList.contains('expanded') && body.scrollHeight <= body.clientHeight + 1;
    }
    window.addEventListener('resize', () => get('lesson-list').querySelectorAll('.lesson-body').forEach(measureBody));
    function renderBrowser(visible) {
      const tree = get('lesson-tree');
      const content = get('lesson-browser-content');
      const treeScroll = tree.scrollTop;
      const contentScroll = content.scrollTop;
      const active = document.activeElement;
      const focusedLesson = active?.dataset.lesson;
      const focusedStatus = active?.dataset.status;
      const focusedClass = active?.className;
      const selected = selections.get(languageId);
      const selectionKey = JSON.stringify([languageId, selected]);
      const root = document.createElement('ul');
      for (const level of (sortOrder === 'hard' ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5])) {
        const lessons = visible.filter(lesson => lesson.difficulty === level);
        if (!lessons.length) continue;
        const group = document.createElement('li'); group.dataset.difficulty = String(level);
        const heading = document.createElement('h3'); heading.textContent = `${level} · ${levels[level - 1]}`;
        const children = document.createElement('ul');
        for (const lesson of lessons) {
          const item = document.createElement('li');
          const choose = button(lesson.title, () => {
            selections.set(languageId, lesson.id);
            render(); save();
            get('lesson-selection-heading').focus({ preventScroll: true });
          });
          choose.dataset.lesson = lesson.id;
          choose.setAttribute('aria-pressed', String(selected === lesson.id));
          choose.setAttribute('aria-controls', 'lesson-detail');
          if (stateLabels[lesson.status]) choose.setAttribute('aria-label', lesson.title + ': ' + stateLabels[lesson.status]);
          if (lesson.custom) {
            const origin = document.createElement('small'); origin.className = 'lesson-origin'; origin.textContent = 'Your lesson';
            choose.appendChild(origin);
          }
          item.appendChild(choose); children.appendChild(item);
        }
        group.append(heading, children); root.appendChild(group);
      }
      tree.replaceChildren(root);
      tree.scrollTop = treeScroll;
      if (!visible.length) {
        const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'No lessons match these filters.';
        tree.appendChild(empty);
      }
      const lesson = visible.find(lesson => lesson.id === selected);
      const detail = get('lesson-detail'); detail.replaceChildren();
      get('lesson-selection-heading').textContent = lesson?.title ?? 'Choose a lesson';
      get('lesson-browser-message').hidden = !!lesson;
      if (lesson) detail.appendChild(createLessonCard(lesson, true));
      content.scrollTop = browserSelectionKey === selectionKey ? contentScroll : 0;
      browserSelectionKey = selectionKey;
      if (active && !active.isConnected) {
        const treeButton = [...tree.querySelectorAll('[data-lesson]')].find(node => node.dataset.lesson === focusedLesson);
        const detailButton = focusedStatus ? detail.querySelector(`[data-status="${focusedStatus}"].lesson-progress`)
          : focusedClass ? detail.getElementsByClassName(focusedClass)[0] : undefined;
        (treeButton ?? detailButton ?? get('lesson-selection-heading')).focus({ preventScroll: true });
      }
    }
    function render() {
      order.textContent = sortOrder === 'hard' ? '↓' : '↑';
      order.setAttribute('aria-label', sortOrder === 'hard' ? 'Easiest first' : 'Hardest first');
      order.title = sortOrder === 'hard' ? 'Hardest first; click for easiest first' : 'Easiest first; click for hardest first';
      hideDone.setAttribute('aria-pressed', String(hideCompleted));
      hideDone.title = hideCompleted ? 'Completed lessons are hidden; click to show them' : 'Click to hide completed lessons';
      const current = library();
      get('lessons-heading').textContent = (browserMode ? 'Lesson browser' : 'Lesson tracker') + (current ? ' · ' + current.language : '');
      get('lesson-new').disabled = !current || current.lessons.filter(lesson => lesson.custom).length >= 200;
      get('lesson-reset-language').disabled = !current;
      get('lesson-reset-all').disabled = !libraries.length;
      const lessons = current?.lessons ?? [];
      const hiddenCount = lessons.filter(lesson => lesson.status === 'hidden').length;
      get('lesson-summary').textContent = `${lessons.filter(lesson => lesson.status === 'done').length} of ${lessons.length - hiddenCount} done · ${lessons.filter(lesson => lesson.status === 'in-progress').length} in progress · ${lessons.filter(lesson => lesson.status === 'todo').length} to do${hiddenCount ? ` · ${hiddenCount} hidden` : ''}`;
      const visible = lessons.filter(lesson => (difficulty.value === 'all' || lesson.difficulty === Number(difficulty.value))
        && (lesson.status !== 'hidden' || status.value === 'hidden')
        && (status.value === 'all' || lesson.status === status.value) && (!hideCompleted || lesson.status !== 'done'))
        .sort((a, b) => (sortOrder === 'hard' ? b.difficulty - a.difficulty : a.difficulty - b.difficulty));
      const next = JSON.stringify([languageId, visible, browserMode, selections.get(languageId)]);
      if (signature === next) return;
      signature = next;
      const list = get('lesson-list');
      resizeObserver?.disconnect();
      if (browserMode) {
        list.replaceChildren();
        renderBrowser(visible);
        return;
      }
      get('lesson-tree').replaceChildren();
      get('lesson-detail').replaceChildren();
      const tracked = visible.filter(lesson => lesson.status !== 'untracked');
      const active = document.activeElement;
      const focusedId = active?.closest('[data-id]')?.dataset.id;
      const focusClass = active?.className;
      const focusStatus = active?.dataset.status;
      list.replaceChildren();
      for (const [name, group] of [['In progress', tracked.filter(lesson => lesson.status === 'in-progress')],
        ['To do', tracked.filter(lesson => lesson.status === 'todo')],
        ['Done', tracked.filter(lesson => lesson.status === 'done')],
        ['Hidden', tracked.filter(lesson => lesson.status === 'hidden')]]) {
        if (!group.length) continue;
        const heading = document.createElement('h2'); heading.textContent = name; list.appendChild(heading);
        for (const lesson of group) {
          const card = createLessonCard(lesson);
          list.appendChild(card);
          const body = card.querySelector('.lesson-body');
          resizeObserver?.observe(body);
          measureBody(body);
        }
      }
      get('lesson-empty').hidden = tracked.length > 0;
      if (focusedId && !active.isConnected) {
        const card = [...list.querySelectorAll('.lesson-card')].find(node => node.dataset.id === focusedId);
        const control = focusStatus ? card?.querySelector(`[data-status="${focusStatus}"]`) : card?.getElementsByClassName(focusClass)[0];
        (control ?? list.querySelector('.lesson-progress') ?? get('lesson-new')).focus();
      }
    }
    return {
      preferences: () => ({ lessonDifficulty: difficulty.value, lessonStatus: status.value,
        lessonOrder: sortOrder, lessonHideDone: hideCompleted, lessonSelections: Object.fromEntries(selections) }),
      setBrowserMode: value => {
        browserMode = value;
        get('lessons-heading').textContent = value ? 'Lesson browser' : 'Lesson tracker';
        get('lesson-browser').hidden = !value;
        get('lesson-tracker').hidden = value;
        get('lesson-browse').hidden = value;
        const untracked = status.querySelector('option[value="untracked"]');
        untracked.disabled = !value;
        untracked.hidden = !value;
        if (!value && status.value === 'untracked') status.value = 'all';
        render();
      },
      update: state => {
        libraries = state.lessonLibraries ?? [];
        // Follow the sidebar's canonical context, including terminal and adapter aliases.
        // Unsaved forms retain their original language through formLanguage.
        languageId = state.languageId;
        render();
      },
    };
  };
})();
