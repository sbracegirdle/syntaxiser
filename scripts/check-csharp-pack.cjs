const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const fixture = path.join(root,'playground/csharp');
const pack = require('../packs/csharp.json');
const checks = require('../playground/csharp/catalog-checks.json');
const situations = require('../playground/csharp/situations.json');
const generated = path.join(fixture,'.catalog');
fs.rmSync(generated,{recursive:true,force:true});
for (const kind of ['library','tests']) fs.mkdirSync(path.join(generated,kind),{recursive:true});
for (const card of pack.cards) {
  const kind = /^using Xunit;|\nusing Xunit;/.test(card.code) ? 'tests' : 'library';
  if (kind === 'library' && !checks[card.id]) throw Error('Missing behavior check: '+card.id);
  if (!situations[card.id]?.length) throw Error('Missing situation map: '+card.id);
  if (typeof checks[card.id] === 'object' && JSON.stringify(Object.keys(checks[card.id]).sort()) !== JSON.stringify([...situations[card.id]].sort())) throw Error('Situation/check mismatch: '+card.id);
  const globalUsings = card.code.match(/^global using [^;]+;$/gm) ?? [];
  const body = card.code.replace(/^global using [^;]+;\n?/gm, '');
  fs.writeFileSync(path.join(generated,kind,card.id+'.cs'), globalUsings.join('\n')+'\nnamespace Syntaxiser.Catalog {\n'+body+'\n}\n');
}
for (const id of [...Object.keys(checks),...Object.keys(situations)]) if (!pack.cards.some(c=>c.id===id)) throw Error('Stale check: '+id);
const cases=Object.entries(checks).flatMap(([id,body])=>typeof body==='string'?[[id,body]]:Object.entries(body).map(([s,code])=>[id+'_'+s,code]));
fs.writeFileSync(path.join(generated,'tests/Behavior.cs'),
  'using Xunit;\nusing Microsoft.EntityFrameworkCore;\nusing Microsoft.Extensions.DependencyInjection;\nusing static Syntaxiser.Catalog.BehaviorHelpers;\nnamespace Syntaxiser.Catalog;\npublic class CatalogBehavior {\n'+
  cases.map(([id,body])=>'[Fact] public async Task '+id.replaceAll('-','_')+'() {\nawait Task.CompletedTask;\n'+body+'\n}').join('\n')+'\n}');
console.log('Generated '+pack.cards.length+' exact card compilation units and '+cases.length+' independent behavior cases.');
if (process.argv.includes('--generate-only')) process.exit(0);
const dotnet = process.env.DOTNET_BIN || 'dotnet';
console.log('Toolchain: Node '+process.version);
for (const args of [['--info'],['restore','Syntaxiser.sln','--locked-mode'],['build','Syntaxiser.sln','--no-restore'],['test','Tests/Tests.csproj','--no-build','--no-restore','--logger','trx;LogFileName=catalog.trx'],['run','--project','Console/Console.csproj','--no-build','--no-restore']]) {
  const result = spawnSync(dotnet,args,{cwd:fixture,stdio:'inherit',timeout:300_000});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
