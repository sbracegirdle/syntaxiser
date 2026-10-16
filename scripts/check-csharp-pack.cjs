const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const fixture = path.join(root,'playground/csharp');
const pack = require('../packs/csharp.json');
const checks = require('../playground/csharp/catalog-checks.json');
const generated = path.join(fixture,'.catalog');
fs.rmSync(generated,{recursive:true,force:true});
for (const kind of ['library','tests']) fs.mkdirSync(path.join(generated,kind),{recursive:true});
const testTopics = new Set(['api-tests','xunit','xunit-theory','xunit-async']);
for (const card of pack.cards) {
  const kind = testTopics.has(card.topics[0]) ? 'tests' : 'library';
  if (kind === 'library' && !checks[card.id]) throw Error('Missing behavior check: '+card.id);
  fs.writeFileSync(path.join(generated,kind,card.id+'.cs'),'namespace Syntaxiser.Catalog {\n'+card.code+'\n}\n');
}
for (const id of Object.keys(checks)) if (!pack.cards.some(c=>c.id===id)) throw Error('Stale check: '+id);
fs.writeFileSync(path.join(generated,'tests/Behavior.cs'),
  'using Xunit;\nnamespace Syntaxiser.Catalog;\npublic class CatalogBehavior {\n'+
  Object.entries(checks).map(([id,body])=>'[Fact] public async Task '+id.replaceAll('-','_')+'() {\nawait Task.CompletedTask;\n'+body+'\n}').join('\n')+'\n}');
console.log('Generated '+pack.cards.length+' actual card snippets and '+Object.keys(checks).length+' behavior tests.');
if (process.argv.includes('--generate-only')) process.exit(0);
const dotnet = process.env.DOTNET_BIN || 'dotnet';
for (const args of [['restore','Syntaxiser.sln','--locked-mode'],['build','Syntaxiser.sln','--no-restore'],['test','Tests/Tests.csproj','--no-build','--no-restore'],['run','--project','Console/Console.csproj','--no-build','--no-restore']]) {
  const result = spawnSync(dotnet,args,{cwd:fixture,stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
