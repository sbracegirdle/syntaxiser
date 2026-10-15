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
    const fields = { title: get('lesson-title'), difficulty: get('lesson-level'), instructions: get('lesson-instructions'),
      starter: get('lesson-starter'), check: get('lesson-check') };
    const labels = { untracked: 'Not tracked', todo: 'To do (pinned)', 'in-progress': 'In progress', done: 'Done' };
    const levels = ['First steps', 'Beginner', 'Intermediate', 'Advanced', 'Challenging'];
    let selectedLanguage = typeof saved?.lessonLanguage === 'string' ? saved.lessonLanguage : '';
    let libraries = [];
    let signature = '';
    let editing;
    let formLanguage;
    for (const [control, value] of [[difficulty, saved?.lessonDifficulty], [status, saved?.lessonStatus], [order, saved?.lessonOrder]]) {
      if ([...control.options].some(option => option.value === value)) control.value = value;
    }
    hideDone.checked = saved?.lessonHideDone === true;
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
      editing = lesson?.id;
      formLanguage = language.value;
      get('lesson-form-heading').textContent = (lesson ? 'Edit lesson · ' : 'New lesson · ') + library().language;
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
      if (![fields.title, fields.instructions, fields.check].every(field => field.value.trim())) {
        get('lesson-form-message').textContent = 'Add a title, instructions, and a way to check your work.';
        return;
      }
      message({ action: 'save', languageId: formLanguage, id: editing, lesson: {
        title: fields.title.value.trim(), difficulty: Number(fields.difficulty.value), instructions: fields.instructions.value.trim(),
        starter: fields.starter.value, check: fields.check.value.trim(),
      } });
      closeForm();
    });
    language.addEventListener('change', () => {
      selectedLanguage = language.value;
      // Keep an unsaved draft tied to its original language until saved/cancelled.
      render(); save();
    });
    for (const control of [difficulty, status, order, hideDone]) control.addEventListener('change', () => {
      if (control === status && status.value === 'done') hideDone.checked = false;
      render(); save();
    });
    get('lesson-reset-language').addEventListener('click', () => message({ action: 'reset', all: false }));
    get('lesson-reset-all').addEventListener('click', () => message({ action: 'reset', all: true }));

    function render() {
      const current = library();
      get('lesson-new').disabled = !current || current.lessons.filter(lesson => lesson.custom).length >= 200;
      get('lesson-reset-language').disabled = !current;
      get('lesson-reset-all').disabled = !libraries.length;
      const lessons = current?.lessons ?? [];
      get('lesson-summary').textContent = `${lessons.filter(lesson => lesson.status === 'done').length} of ${lessons.length} done · ${lessons.filter(lesson => lesson.status === 'todo').length} pinned · ${lessons.filter(lesson => lesson.status === 'in-progress').length} in progress`;
      const visible = lessons.filter(lesson => (difficulty.value === 'all' || lesson.difficulty === Number(difficulty.value))
        && (status.value === 'all' || lesson.status === status.value) && (!hideDone.checked || lesson.status !== 'done'))
        .sort((a, b) => (order.value === 'hard' ? b.difficulty - a.difficulty : a.difficulty - b.difficulty));
      const next = JSON.stringify([language.value, visible]);
      if (signature === next) return;
      signature = next;
      const list = get('lesson-list');
      const expanded = new Set([...list.querySelectorAll('details[open]')].map(node => node.dataset.id));
      const active = document.activeElement;
      const focusedId = active?.closest('[data-id]')?.dataset.id;
      const focusClass = active?.className;
      list.replaceChildren();
      for (const [name, group] of [['Pinned to do', visible.filter(lesson => lesson.status === 'todo')],
        ['Challenges', visible.filter(lesson => lesson.status !== 'todo')]]) {
        if (!group.length) continue;
        const heading = document.createElement('h2'); heading.textContent = name; list.appendChild(heading);
        for (const lesson of group) {
          const card = document.createElement('div'); card.className = 'lesson-card'; card.dataset.id = lesson.id;
          const details = document.createElement('details'); details.dataset.id = lesson.id; details.open = expanded.has(lesson.id);
          const summary = document.createElement('summary'); summary.className = 'lesson-toggle';
          const title = document.createElement('span'); title.textContent = lesson.title;
          const badge = document.createElement('small'); badge.textContent = `${lesson.difficulty} · ${levels[lesson.difficulty - 1]}${lesson.custom ? ' · Custom' : ''}`;
          summary.append(title, badge);
          const instructions = document.createElement('p'); instructions.textContent = lesson.instructions;
          details.append(summary, instructions);
          if (lesson.starter) {
            const pre = document.createElement('pre'); pre.tabIndex = 0;
            const code = document.createElement('code'); code.textContent = lesson.starter;
            window.SyntaxiserHighlight?.highlight(code, language.value);
            pre.appendChild(code); details.appendChild(pre);
          }
          const check = document.createElement('p'); check.className = 'lesson-check';
          const checkLabel = document.createElement('strong'); checkLabel.textContent = 'Check your work: ';
          check.append(checkLabel, lesson.check); details.appendChild(check);
          const tools = document.createElement('div'); tools.className = 'lesson-tools';
          const select = document.createElement('select'); select.className = 'lesson-progress';
          select.setAttribute('aria-label', 'Status for ' + lesson.title);
          for (const [value, label] of Object.entries(labels)) {
            const option = document.createElement('option'); option.value = value; option.textContent = label;
            select.appendChild(option);
          }
          select.value = lesson.status;
          select.addEventListener('change', () => message({ action: 'status', id: lesson.id, status: select.value }));
          tools.appendChild(select);
          if (lesson.custom) {
            const edit = button('Edit', () => openForm(lesson)); edit.className = 'lesson-edit';
            edit.setAttribute('aria-label', 'Edit ' + lesson.title);
            const remove = button('Delete…', () => message({ action: 'delete', id: lesson.id })); remove.className = 'lesson-delete';
            remove.setAttribute('aria-label', 'Delete ' + lesson.title);
            tools.append(edit, remove);
          }
          card.append(details, tools); list.appendChild(card);
        }
      }
      get('lesson-empty').hidden = visible.length > 0;
      if (focusedId && !active.isConnected) {
        const card = [...list.querySelectorAll('.lesson-card')].find(node => node.dataset.id === focusedId);
        (card?.getElementsByClassName(focusClass)[0] ?? list.querySelector('.lesson-progress') ?? get('lesson-new')).focus();
      }
    }
    return {
      preferences: () => ({ lessonLanguage: selectedLanguage, lessonDifficulty: difficulty.value, lessonStatus: status.value,
        lessonOrder: order.value, lessonHideDone: hideDone.checked }),
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
