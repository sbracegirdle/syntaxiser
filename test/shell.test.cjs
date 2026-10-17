const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { shellAdapter, shellCues } = require('../out/languages/shell');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const pack = validatePack({ ...require('../packs/shellscript.json'), referenceTopics: require('../packs/shellscript-reference.json') });
const { awsOperations } = require('../out/languages/shell');

test('terminal catalog has separate overviews and parseable Bash examples for every topic', () => {
  assert.equal(pack.cards.length, 119);
  assert.equal(pack.referenceTopics.length, 82);
  assert.equal(pack.referenceTopics.length, pack.concepts.length);
  for (const card of pack.cards) {
    for (const id of card.topics) assert.notEqual(card.code, pack.referenceTopics.find(t => t.id === id).syntax);
    execFileSync('bash', ['-n'], { input: card.code });
  }
});

test('shell context keeps known command cues without retaining paths, secrets, or output', () => {
  assert.equal(shellCues('TOKEN=secret cargo test private_test --token secret | tee /secret/path'), 'cargo test\ntee');
  assert.equal(shellCues('curl https://secret.example -H "Authorization: Bearer secret"'), 'curl');
  assert.equal(shellCues('echo "cargo test" # go test'), '');
  const context = shellAdapter.extract({ text: 'git status\ncargo test', offset: 16, symbols: [], recentEdits: [] });
  assert.equal(context.currentLine, 'cargo test');
  assert.equal(context.scope, 'block');
});

test('terminal tool context and natural language search retrieve the expected examples and overviews', () => {
  const retriever = new Retriever(pack);
  for (const [text, id] of [['cargo test','cargo-test'], ['go test','go-test'], ['pnpm exec tsc --noEmit','typescript'], ['git diff','git-status']]) {
    const context = shellAdapter.extract({ text, offset: 0, symbols: [], recentEdits: [] });
    assert.equal(retriever.relevant(context)[0].card.id, id);
    assert.equal(retriever.relevantTopics(context, 2)[0], id);
  }
  assert.equal(retriever.search('TypeScript')[0].card.id, 'typescript');
  assert.equal(retriever.search('find files')[0].card.id, 'find');
});

test('AWS context retains allowlisted services and operations but no resource or option values', () => {
  for (const [source, expected] of [
    ['aws', 'aws'], ['aws --profile private --region ap-southeast-2 s3 sync /private s3://private --delete', 'aws s3 sync'],
    ['aws --profile=private --no-cli-pager ec2 describe-instances --instance-ids private', 'aws ec2 describe-instances'],
    ['TOKEN=secret command aws ssm get-parameter --name /secret --with-decryption', 'aws ssm get-parameter'],
    ['aws secretsmanager get-secret-value --secret-id private', 'aws secretsmanager get-secret-value'],
    ['aws unknown secret', 'aws'], ['aws s3 unknown-private-command', 'aws s3'],
    ['aws --unknown private s3 cp', 'aws'], ['aws --profile', 'aws'], ['aws --version', 'aws'],
    ['aws ecr get-login-password --profile private | docker login --password-stdin private', 'aws ecr get-login-password'],
    ['echo "aws s3 cp private" # aws sts get-caller-identity', ''],
  ]) assert.equal(shellCues(source), expected, source);
  for (const [service, operations] of Object.entries(awsOperations)) {
    for (const operation of operations) {
      assert.equal(shellCues(`aws ${service} ${operation} --secret private`), `aws ${service} ${operation}`);
    }
  }
});

test('AWS commands and natural queries surface focused service examples and separate overviews', () => {
  const retriever = new Retriever(pack);
  for (const [query, topic] of [
    ['aws sso login', 'aws-auth'], ['aws sts get-caller-identity', 'aws-auth'],
    ['aws s3 cp', 'aws-s3'], ['aws s3 sync', 'aws-s3-sync'], ['aws s3api head-object', 'aws-s3api'],
    ['aws ec2 describe-instances', 'aws-ec2'], ['aws iam get-role', 'aws-iam'],
    ['aws logs tail', 'aws-logs'], ['aws lambda invoke', 'aws-lambda'],
    ['aws cloudformation deploy', 'aws-cloudformation'], ['aws dynamodb query', 'aws-dynamodb'],
    ['aws ssm get-parameter', 'aws-ssm'], ['aws secretsmanager get-secret-value', 'aws-secretsmanager'],
    ['aws ecr get-login-password', 'aws-ecr'], ['aws ecs describe-services', 'aws-ecs'],
    ['aws eks update-kubeconfig', 'aws-eks'], ['aws cloudwatch describe-alarms', 'aws-cloudwatch'],
    ['SSO login', 'aws-auth'], ['S3 backup', 'aws-s3-sync'], ['tail logs', 'aws-logs'],
    ['partition key', 'aws-dynamodb'], ['JMESPath', 'aws-query'], ['AWS pagination', 'aws-query'],
  ]) {
    assert.equal(retriever.search(query)[0].card.topics[0], topic, query);
    assert.equal(retriever.searchTopics(query)[0], topic, query);
    if (query.startsWith('aws ')) {
      const context = shellAdapter.extract({ text: query, offset: 0, symbols: [], recentEdits: [] });
      assert.equal(retriever.relevant(context)[0].card.topics[0], topic, query);
      assert.equal(retriever.relevantTopics(context)[0], topic, query);
    }
  }
  const awsConcepts = pack.concepts.filter(c => c.id.startsWith('aws-'));
  assert.equal(awsConcepts.length, 18);
  for (const concept of awsConcepts) {
    assert.ok(pack.cards.some(card => card.topics.includes(concept.id)), concept.id);
    assert.ok(pack.referenceGroups.some(group => group.topics.includes(concept.id)), concept.id);
    assert.match(pack.referenceTopics.find(t => t.id === concept.id).rules.join(' '), /https:\/\/docs\.aws\.amazon\.com\//);
  }
});
