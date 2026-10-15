const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validatePack } = require('../out/core/pack');

for (const language of ['rust', 'go', 'typescript', 'shellscript', 'html', 'css']) {
  test(`${language}: every bundled overview has titled HTTPS learning references`, () => {
    const referenceTopics = require(`../packs/${language}-reference.json`);
    const pack = validatePack({ ...require(`../packs/${language}.json`), referenceTopics });
    assert.equal(referenceTopics.length, pack.concepts.length);
    for (const topic of referenceTopics) {
      assert.ok(topic.references?.length, topic.id);
      assert.equal(new Set(topic.references.map(reference => reference.url)).size, topic.references.length);
    }
  });
}

test('reference validation rejects unsafe and malformed sources while retaining legacy compatibility', () => {
  const pack = require('../packs/go.json');
  const topic = require('../packs/go-reference.json')[0];
  const withReferences = references => ({ ...pack, referenceTopics: [{ ...topic, references }] });
  assert.doesNotThrow(() => validatePack(withReferences(undefined)));
  for (const references of [null, [], {}, [null], [{ title: ' ' , url: 'https://go.dev/' }],
    [{ title: 'Docs', url: 42 }], [{ title: 'Docs', url: 'invalid' }],
    ...['javascript:alert(1)', 'command:workbench.action.closeWindow', 'file:///etc/passwd',
      'data:text/html,<script>', 'http://go.dev/', 'https://user:secret@go.dev/'].map(url => [{ title: 'Docs', url }]),
    [topic.references[0], topic.references[0]]]) {
    assert.throws(() => validatePack(withReferences(references)), /Invalid reference topic/);
  }
});
