const { test } = require('node:test');
const assert = require('node:assert/strict');
const { LessonStore, parseLessonAction } = require('../out/core/lessons');
const { builtinLessons } = require('../out/lessons/catalog');
const languages = [{ languageId: 'rust', displayName: 'Rust' }, { languageId: 'go', displayName: 'Go' }];
const custom = { title: 'My challenge', difficulty: 3, instructions: 'Implement a parser.', starter: '// start here', check: 'Add passing tests.' };
const status = (languageId, id, status) => ({ action: 'status', languageId, id, status });

test('progress and custom lessons round-trip independently by language and reset scope', () => {
  const store = new LessonStore(languages);
  store.apply(status('rust', 'hello', 'todo'));
  store.apply(status('go', 'hello', 'done'));
  store.apply({ action: 'save', languageId: 'rust', lesson: custom });
  const added = store.libraries()[0].lessons.find(lesson => lesson.custom);
  assert.equal(added.status, 'todo');
  assert.match(added.id, /^custom-/);
  store.apply(status('rust', added.id, 'in-progress'));
  const snapshot = store.serialize();
  store.apply({ action: 'save', languageId: 'rust', id: added.id, lesson: { ...custom, title: 'Updated' } });
  assert.equal(store.libraries()[0].lessons.find(lesson => lesson.custom).status, 'in-progress');
  const restored = new LessonStore(languages, snapshot);
  assert.equal(restored.libraries()[0].lessons.find(lesson => lesson.custom).title, custom.title, 'queued snapshots stay independent');
  assert.equal(restored.libraries()[0].lessons[0].status, 'todo');
  assert.equal(restored.libraries()[1].lessons[0].status, 'done');
  restored.reset('rust', false, false);
  assert.ok(restored.libraries()[0].lessons.every(lesson => lesson.status === 'untracked'));
  assert.equal(restored.libraries()[0].lessons.filter(lesson => lesson.custom).length, 1);
  assert.equal(restored.libraries()[1].lessons[0].status, 'done');
  restored.reset('rust', true, true);
  assert.ok(restored.libraries().every(library => library.lessons.every(lesson => !lesson.custom && lesson.status === 'untracked')));
});

test('host rejects malformed actions and protects curated lessons', () => {
  const store = new LessonStore(languages);
  for (const action of [null, [], {}, { action: 'save', languageId: 'rust', lesson: { ...custom, title: ' ' } },
    { action: 'save', languageId: 'rust', lesson: { ...custom, starter: 'x'.repeat(12001) } },
    { action: 'save', languageId: 'rust', lesson: { ...custom, difficulty: 2.5 } },
    { ...status('rust', 'hello', 'unknown') }, { action: 'reset', languageId: 'rust', all: 'true' }]) {
    assert.equal(parseLessonAction(action), undefined);
  }
  assert.ok(parseLessonAction({ action: 'save', languageId: 'rust', lesson: custom }));
  const simple = { ...custom, starter: '', check: '' };
  assert.ok(parseLessonAction({ action: 'save', languageId: 'rust', lesson: simple }));
  assert.equal(store.apply({ action: 'save', languageId: 'rust', lesson: simple }), true);
  assert.equal(new LessonStore(languages, store.serialize()).libraries()[0].lessons.find(lesson => lesson.custom).check, '');
  assert.equal(store.apply({ action: 'save', languageId: 'rust', id: 'hello', lesson: custom }), false);
  assert.equal(store.apply({ action: 'delete', languageId: 'rust', id: 'hello' }), false);
  assert.equal(store.apply(status('rust', 'unknown', 'done')), false);
  assert.equal(store.apply(status('unknown', 'hello', 'done')), false);
  store.apply({ action: 'save', languageId: 'go', lesson: custom });
  const id = store.libraries()[1].lessons.find(lesson => lesson.custom).id;
  store.apply(status('go', id, 'done'));
  assert.equal(store.apply({ action: 'delete', languageId: 'go', id }), true);
  assert.equal(new LessonStore(languages, store.serialize()).libraries()[1].lessons.length, builtinLessons.go.length);
});

test('corrupt saved state is bounded and ignored without preventing startup', () => {
  const raw = { version: 1, languages: { rust: { custom: [null, { ...custom, id: 'hello' }, { ...custom, id: 'custom-valid' }, { ...custom, id: 'custom-valid' }],
    statuses: { hello: 'done', retired: 'done', 'custom-valid': 'todo', variables: 'invalid' } } } };
  const library = new LessonStore(languages, raw).libraries()[0];
  assert.equal(library.lessons.filter(lesson => lesson.custom).length, 1);
  assert.equal(library.lessons[0].status, 'done');
  assert.equal(library.lessons[1].status, 'untracked');
  for (const value of [null, [], 'invalid', { version: 99, languages: raw.languages }]) {
    assert.ok(new LessonStore(languages, value).libraries()[0].lessons.every(lesson => lesson.status === 'untracked'));
  }
});

test('each built-in path progresses through all five levels with actionable checks', () => {
  for (const lessons of Object.values(builtinLessons)) {
    assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length);
    assert.deepEqual([...new Set(lessons.map(lesson => lesson.difficulty))], [1, 2, 3, 4, 5]);
    for (const lesson of lessons) {
      assert.ok(parseLessonAction({ action: 'save', languageId: 'rust', lesson }));
      assert.ok(lesson.instructions.length > 40 && lesson.check.length > 40);
      assert.equal(lesson.starter, '', `${lesson.id} must not show a redundant code block`);
    }
  }
});

test('hidden status persists per language and resets alongside other progress', () => {
  const store = new LessonStore(languages);
  const action = status('rust', 'hello', 'hidden');
  assert.deepEqual(parseLessonAction(action), action);
  assert.equal(store.apply(action), true);
  const restored = new LessonStore(languages, store.serialize());
  assert.equal(restored.libraries()[0].lessons[0].status, 'hidden');
  assert.equal(restored.libraries()[1].lessons[0].status, 'untracked');
  restored.apply(status('rust', 'hello', 'untracked'));
  assert.equal(restored.libraries()[0].lessons[0].status, 'untracked');
  restored.apply(action);
  restored.reset('rust', false, false);
  assert.equal(restored.libraries()[0].lessons[0].status, 'untracked');
});

const { expandedExercises } = require('../out/lessons/expanded');

test('expanded tracks retain legacy identities and gate unsupported languages', () => {
  const legacy = ['hello', 'variables', 'functions', 'branches-loops', 'word-count', 'capstone'];
  const retained = {rust: [...legacy, 'borrowing', 'structs-options', 'results', 'iterator-pipeline', 'traits', 'threads'], go: [...legacy, 'slices', 'structs', 'errors', 'interfaces', 'table-tests', 'goroutines'], sql: ['sql-first-report', 'sql-missing-orders', 'sql-paid-totals', 'sql-ranked-orders', 'sql-safe-change']};
  for (const [lang, ids] of Object.entries(retained)) for (const id of ids) assert.equal(builtinLessons[lang].filter(l => l.id === id).length, 1);
  for (const lang of ['rust', 'go']) for (const id of legacy) {
    assert.equal(builtinLessons[lang].filter(lesson => lesson.id === id).length, 1);
  }
  assert.deepEqual(Object.keys(expandedExercises).sort(), ['css', 'go', 'html', 'javascript', 'rust', 'shellscript', 'sql', 'typescript']);
  for (const lang of ['python', 'java', 'csharp', 'yaml']) assert.equal(expandedExercises[lang], undefined);
  for (const [lang, lessons] of Object.entries(builtinLessons)) {
    assert.deepEqual(lessons.map(l => l.difficulty), lessons.map(l => l.difficulty).sort((a, b) => a - b), lang);
  }
});

test('every added exercise has resolvable earlier prerequisites, setup, checks and no scaffold', () => {
  let count = 0;
  for (const [languageId, exercises] of Object.entries(expandedExercises)) {
    const lessons = builtinLessons[languageId];
    for (const exercise of exercises) {
      count++;
      const { lesson, topics, prerequisites, reference } = exercise;
      assert.ok(topics.length > 0);
      assert.equal(lesson.starter, '');
      assert.ok(parseLessonAction({ action: 'save', languageId, lesson }));
      assert.match(lesson.instructions, /Prerequisites: .*Goal: .*Setup and run: .*Learning reference: https:/s);
      assert.ok(new URL(reference).protocol === 'https:');
      assert.ok(lesson.check.length > 60);
      for (const id of prerequisites) {
        const before = lessons.findIndex(candidate => candidate.id === id);
        assert.ok(before >= 0 && before < lessons.findIndex(candidate => candidate.id === lesson.id), `${languageId}/${lesson.id}: ${id}`);
      }
    }
  }
  assert.equal(count, 123);
});

test('new language progress and custom state survive expansion, reload and scoped reset', () => {
  const all = Object.keys(builtinLessons).map(languageId => ({languageId, displayName: languageId}));
  const store = new LessonStore(all, {version: 1, languages: {rust: {custom: [], statuses: {capstone: 'done', hello: 'hidden'}}, go: {custom: [], statuses: {hello: 'in-progress'}}}});
  for (const lang of ['typescript', 'javascript', 'shellscript', 'html', 'css', 'sql']) {
    assert.equal(store.apply(status(lang, builtinLessons[lang][0].id, 'done')), true);
    assert.equal(store.apply({action: 'save', languageId: lang, lesson: custom}), true);
  }
  const restored = new LessonStore(all, store.serialize());
  const rust = restored.libraries().find(l => l.languageId === 'rust');
  assert.equal(rust.lessons.find(l => l.id === 'capstone').status, 'done');
  assert.equal(rust.lessons.find(l => l.id === 'hello').status, 'hidden');
  restored.reset('typescript', false, false);
  const ts = restored.libraries().find(l => l.languageId === 'typescript');
  assert.ok(ts.lessons.every(l => l.status === 'untracked'));
  assert.equal(ts.lessons.filter(l => l.custom).length, 1);
  const js = restored.libraries().find(l => l.languageId === 'javascript');
  assert.equal(js.lessons[0].status, 'done');
  assert.equal(js.lessons.filter(l => l.custom).length, 1);
});
