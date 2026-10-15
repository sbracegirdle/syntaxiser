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
  assert.equal(added.status, 'untracked');
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
      assert.ok(lesson.instructions.length > 40 && lesson.check.length > 40 && lesson.starter);
    }
  }
});
