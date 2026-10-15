(function () {
  'use strict';
  window.SyntaxiserLessons = function (vscode, saved, save) {
    const get = id => document.getElementById(id);
    const language = get('lesson-language');
    const difficulty = get('lesson-difficulty');
    const status = get('lesson-status');
    const order = get('lesson-order');
    const hideDone = get('lesson-hide-done');
    const form = get('lesson-form');
    const fields = { title: get('lesson-title'), instructions: get('lesson-instructions') };
    const labels = { todo: 'To do', 'in-progress': 'In progress', done: 'Done' };
    const levels = ['First steps', 'Beginner', 'Intermediate', 'Advanced', 'Challenging'];
    let selectedLanguage = typeof saved?.lessonLanguage === 'string' ? saved.lessonLanguage : '';
    let libraries = [];
    let signature = '';
    let editing;
    let formLanguage;
    let formDifficulty;
    let sortOrder = saved?.lessonOrder === 'hard' ? 'hard' : 'easy';
    let hideCompleted = saved?.lessonHideDone === true;
    const expanded = new Set();
    let bodyId = 0;
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(entries => {
      for (const entry of entries) measureBody(entry.target);
    });
    for (const [control, value] of [[difficulty, saved?.lessonDifficulty], [status, saved?.lessonStatus]]) {
      if ([...control.options].some(option => option.value === value)) control.value = value;
    }
    const message = action => vscode.postMessage({ type: 'lesson', languageId: language.value, ...action });
    const library = () => libraries.find(item => item.languageId === language.value);
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
      formLanguage = language.value;
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
    language.addEventListener('change', () => {
      selectedLanguage = language.value;
      // Keep an unsaved draft tied to its original language until saved/cancelled.
      render(); save();
    });
    for (const control of [difficulty, status]) control.addEventListener('change', () => {
      if (control === status && status.value === 'done') hideCompleted = false;
      render(); save();
    });
    order.addEventListener('click', () => { sortOrder = sortOrder === 'hard' ? 'easy' : 'hard'; render(); save(); });
    hideDone.addEventListener('click', () => { hideCompleted = !hideCompleted; render(); save(); });
    get('lesson-reset-language').addEventListener('click', () => message({ action: 'reset', all: false }));
    get('lesson-reset-all').addEventListener('click', () => message({ action: 'reset', all: true }));

    function measureBody(body) {
      const more = body.parentElement.querySelector('.lesson-more');
      more.hidden = !body.classList.contains('expanded') && body.scrollHeight <= body.clientHeight + 1;
    }
    window.addEventListener('resize', () => get('lesson-list').querySelectorAll('.lesson-body').forEach(measureBody));
    function render() {
      order.textContent = sortOrder === 'hard' ? '↓' : '↑';
      order.setAttribute('aria-label', sortOrder === 'hard' ? 'Easiest first' : 'Hardest first');
      order.title = sortOrder === 'hard' ? 'Hardest first; click for easiest first' : 'Easiest first; click for hardest first';
      hideDone.setAttribute('aria-pressed', String(hideCompleted));
      const current = library();
      get('lesson-new').disabled = !current || current.lessons.filter(lesson => lesson.custom).length >= 200;
      get('lesson-reset-language').disabled = !current;
      get('lesson-reset-all').disabled = !libraries.length;
      const lessons = current?.lessons ?? [];
      get('lesson-summary').textContent = `${lessons.filter(lesson => lesson.status === 'done').length} of ${lessons.length} done · ${lessons.filter(lesson => lesson.status === 'todo').length} pinned · ${lessons.filter(lesson => lesson.status === 'in-progress').length} in progress`;
      const visible = lessons.filter(lesson => (difficulty.value === 'all' || lesson.difficulty === Number(difficulty.value))
        && (status.value === 'all' || lesson.status === status.value) && (!hideCompleted || lesson.status !== 'done'))
        .sort((a, b) => (sortOrder === 'hard' ? b.difficulty - a.difficulty : a.difficulty - b.difficulty));
      const next = JSON.stringify([language.value, visible]);
      if (signature === next) return;
      signature = next;
      const list = get('lesson-list');
      resizeObserver?.disconnect();
      const active = document.activeElement;
      const focusedId = active?.closest('[data-id]')?.dataset.id;
      const focusClass = active?.className;
      const focusStatus = active?.dataset.status;
      list.replaceChildren();
      for (const [name, group] of [['Pinned to do', visible.filter(lesson => lesson.status === 'todo')],
        ['Challenges', visible.filter(lesson => lesson.status !== 'todo')]]) {
        if (!group.length) continue;
        const heading = document.createElement('h2'); heading.textContent = name; list.appendChild(heading);
        for (const lesson of group) {
          const card = document.createElement('div'); card.className = 'lesson-card'; card.dataset.id = lesson.id;
          const key = JSON.stringify([language.value, lesson.id]);
          const title = document.createElement('h3'); title.textContent = lesson.title;
          const badge = document.createElement('small'); badge.textContent = `${lesson.difficulty} · ${levels[lesson.difficulty - 1]}${lesson.custom ? ' · Custom' : ''}`;
          const body = document.createElement('div'); body.id = `lesson-body-${++bodyId}`;
          body.className = 'lesson-body' + (expanded.has(key) ? ' expanded' : '');
          const instructions = document.createElement('p'); instructions.textContent = lesson.instructions;
          body.appendChild(instructions);
          if (lesson.starter) {
            const pre = document.createElement('pre'); pre.tabIndex = 0;
            const code = document.createElement('code'); code.textContent = lesson.starter;
            window.SyntaxiserHighlight?.highlight(code, language.value);
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
          card.append(title, badge, body, more, tools); list.appendChild(card);
          resizeObserver?.observe(body);
          measureBody(body);
        }
      }
      get('lesson-empty').hidden = visible.length > 0;
      if (focusedId && !active.isConnected) {
        const card = [...list.querySelectorAll('.lesson-card')].find(node => node.dataset.id === focusedId);
        const control = focusStatus ? card?.querySelector(`[data-status="${focusStatus}"]`) : card?.getElementsByClassName(focusClass)[0];
        (control ?? list.querySelector('.lesson-progress') ?? get('lesson-new')).focus();
      }
    }
    return {
      preferences: () => ({ lessonLanguage: selectedLanguage, lessonDifficulty: difficulty.value, lessonStatus: status.value,
        lessonOrder: sortOrder, lessonHideDone: hideCompleted }),
      update: state => {
        libraries = state.lessonLibraries ?? [];
        const nextLanguage = libraries.some(item => item.languageId === selectedLanguage) ? selectedLanguage
          : libraries.some(item => item.languageId === state.languageId) ? state.languageId : libraries[0]?.languageId;
        const options = JSON.stringify(libraries.map(item => [item.languageId, item.language]));
        if (language.dataset.options !== options) {
          language.dataset.options = options;
          language.replaceChildren(...libraries.map(item => {
            const option = document.createElement('option'); option.value = item.languageId; option.textContent = item.language; return option;
          }));
        }
        language.value = nextLanguage ?? '';
        render();
      },
    };
  };
})();
