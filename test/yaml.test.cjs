const {test} = require('node:test');
const assert = require('node:assert/strict');
const {yamlAdapter, yamlSchema, maskYaml} = require('../out/languages/yaml');
const {Retriever} = require('../out/core/retrieval');
const {validatePack} = require('../out/core/pack');
const pack = validatePack({...require('../packs/yaml.json'), referenceTopics:require('../packs/yaml-reference.json')});
const retriever = new Retriever(pack);
function context(source, filePath = '/workspace/config.yaml') {
  return yamlAdapter.extract({text:source.replace('CURSOR',''), offset:source.indexOf('CURSOR'), filePath, symbols:[], recentEdits:['services: jobs: Resources:']});
}

test('YAML has separate grouped overviews, sourced ecosystem examples and activation', () => {
  assert.equal(pack.referenceTopics.length, 25);
  assert.deepEqual(pack.referenceGroups.flatMap(g=>g.topics).sort(), pack.concepts.map(c=>c.id).sort());
  for (const overview of pack.referenceTopics) {
    assert.ok(overview.references.length && overview.rules.length>=2, overview.id);
    assert.ok(pack.cards.some(c=>c.topics.includes(overview.id) && c.explanation));
    assert.ok(pack.cards.every(c=>c.code!==overview.syntax));
  }
  assert.ok(require('../package.json').activationEvents.includes('onLanguage:yaml'));
});

for (const [query,topic] of [
  ['github actions matrix','github-matrix'], ['workflow permissions','github-permissions'],
  ['cloudformation parameter','cfn-parameters'], ['intrinsic ref','cfn-intrinsics'],
  ['compose volume','compose-volumes'], ['multiline yaml','yaml-multiline'],
]) test(`YAML search: ${query}`, () => {
  assert.equal(retriever.search(query,1)[0].card.topics[0],topic);
  assert.equal(retriever.searchTopics(query,1)[0],topic);
});

for (const [source,file,topic,family] of [
  ['jobs:\n  check:\n    strategy:\n      matrix:\n        node: [22, CURSOR24]','/w/.github/workflows/check.yml','github-matrix','github'],
  ['permissions:\n  contents: CURSORread','C:\\w\\.github\\workflows\\check.yaml','github-permissions','github'],
  ['jobs:\n  check:\n    steps:\n      - env:\n          TITLE: "${{ github.event.pull_request.title }}CURSOR"','/w/.github/workflows/check.yml','github-expressions','github'],
  ['Parameters:\n  Stage:\n    Type: CURSORString','/w/cloudformation.yaml','cfn-parameters','cfn'],
  ['Resources:\n  Queue:\n    Type: AWS::SQS::Queue\nOutputs:\n  Url:\n    Value: !Ref CURSORQueue','/w/infra.yaml','cfn-intrinsics','cfn'],
  ['services:\n  app:\n    volumes:\n      - CURSORdata:/data','/w/compose.yaml','compose-volumes','compose'],
  ['services:\n  app:\n    healthcheck:\n      test: CURSOR[CMD, true]','/w/docker-compose.dev.yml','compose-health','compose'],
  ['text: |CURSOR\n  jobs: services: Parameters:','/w/config.yaml','yaml-multiline','yaml'],
]) test(`YAML context isolates ${topic}`, () => {
  const ctx=context(source,file);
  assert.ok(retriever.relevant(ctx,3).some(r=>r.card.topics[0]===topic),JSON.stringify(ctx));
  assert.ok(retriever.relevantTopics(ctx,3).includes(topic),JSON.stringify(ctx));
  assert.ok(retriever.relevant(ctx,60).every(r=>r.card.topics.every(t=>t.startsWith('yaml-')||t.startsWith(family+'-'))));
  assert.ok(retriever.relevantTopics(ctx,60).every(t=>t.startsWith('yaml-')||t.startsWith(family+'-')));
  assert.equal(ctx.recentEdits,'');
});

test('YAML schema uses root keys and paths, tolerates incomplete and quoted keys', () => {
  for (const [source,path,schema] of [
    ['', '/w/.github/workflows/new.yml','github'], ['', '/w/compose.override.yaml','compose'],
    ['"on": push\n"jobs":\n  check:', '/w/new.yml','github'],
    ['AWSTemplateFormatVersion: "2010-09-09"\nResources:', '/w/new.yml','cfn'],
    ['services:\n  app:', '/w/new.yml','compose'],
    ['nested:\n  services:\n    key: value', '/w/new.yml','yaml'],
    ['Resources:\n  value: general', '/w/new.yml','yaml'],
    ['description: |\n  services:\n    web: value', '/w/new.yml','yaml'],
    ['# Resources: Type: AWS::SQS::Queue\ntext: "services: jobs:"', '/w/new.yml','yaml'],
  ]) assert.equal(yamlSchema(source,path),schema,source+path);
});

test('YAML masking preserves offsets and hides comments, escaped strings and block contents', () => {
  for (const source of [
    '# falsecue\nx: 1', 'text: "falsecue\\\"falsecue"\nx: 1', "text: 'it''s falsecue'\nx: 1",
    'text: "multiline\nfalsecue"\nx: 1', 'text: |- # comment\n  falsecue: jobs\nx: 1',
    'text: >-\n  falsecue\n\n  falsecue\nx: 1', 'text: "unfinished falsecue',
  ]) {
    const masked=maskYaml(source);
    assert.equal(masked.length,source.length);
    assert.equal(masked.split('\n').length,source.split('\n').length);
    assert.ok(!masked.includes('falsecue'),source);
  }
  assert.match(maskYaml('value: !Ref Queue'),/!Ref Queue/);
  assert.match(maskYaml('"on": push'),/"on": push/);
  const step=maskYaml('steps:\n  - run: |\n      falsecue: services\n    env:\n      LABEL: value');
  assert.ok(!step.includes('falsecue'));
  assert.match(step,/env:\n      LABEL: value/);
  const ctx=context('services:\n  app:\n    image: redis\n---\nmessage: CURSORhello');
  assert.deepEqual(ctx.topicPrefixes,['yaml-']);
  assert.ok(!ctx.local.includes('services'));
});

test('YAML has five progressive task-only lessons with independent persisted progress', () => {
  const {LessonStore} = require('../out/core/lessons');
  const {builtinLessons} = require('../out/lessons/catalog');
  assert.deepEqual(builtinLessons.yaml.map(l=>l.difficulty),[1,2,3,4,5]);
  assert.ok(builtinLessons.yaml.every(l=>l.starter==='' && l.instructions && l.check));
  const store=new LessonStore([pack,{languageId:'rust',displayName:'Rust'}]);
  store.apply({action:'status',languageId:'yaml',id:'yaml-workflow-matrix',status:'done'});
  const restored=new LessonStore([pack,{languageId:'rust',displayName:'Rust'}],store.serialize());
  assert.equal(restored.libraries()[0].lessons.find(l=>l.id==='yaml-workflow-matrix').status,'done');
  assert.ok(restored.libraries()[1].lessons.every(l=>l.status==='untracked'));
});
