const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {audit,markdown}=require('../scripts/language-coverage.cjs');
const manifest=require('../coverage/languages.json');
const copy=()=>structuredClone(manifest);
const pack=id=>structuredClone(require('../packs/'+id+'.json'));
const refs=id=>structuredClone(require('../packs/'+id+'-reference.json'));

test('common coverage probes exercise real adapters/search in all supported contexts',()=>{
 const report=audit();
 assert.equal(report.languages.length,Object.keys(manifest.languages).length);
 for(const l of report.languages) { assert.equal(l.probesPassed,l.probes,l.language); assert.equal(l.runtimeStatus,'not-run'); }
 assert.equal(new Set(report.findings.map(f=>f.key)).size,report.findings.length);
 assert.equal(markdown(report),require('node:fs').readFileSync(require('node:path').join(__dirname,'../docs/language-coverage.md'),'utf8'));
});
test('audit catches removed examples, ungrouped topics, copied overviews and missing official-source candidates',()=>{
 const load=id=>{const p=pack(id);if(id==='go'){p.cards=p.cards.filter(c=>!c.topics.includes('maps'));p.referenceGroups=p.referenceGroups.map(g=>({...g,topics:g.topics.filter(t=>t!=='errors')}));}return p;};
 const reference=id=>{const r=refs(id);if(id==='go'){r.find(t=>t.id==='variables').syntax=pack(id).cards.find(c=>c.topics.includes('variables')).code;delete r.find(t=>t.id==='errors').references;}return r;};
 const keys=new Set(audit(copy(),load,reference).findings.map(f=>f.key));
 for(const key of ['go:example:maps','go:group:errors','go:separation:variables','go:source:errors'])assert.ok(keys.has(key),key);
});
test('parse/typecheck/execution evidence never masks missing behavioral situations',()=>{
 const report=audit();
 for(const id of ['go','typescript','python']) assert.ok(report.findings.some(f=>f.language===id&&f.rule==='behavior-happy'),id);
 const m=copy();m.languages.go.evidence.push({card:'maps',kind:'behavior',source:'test/go.test.cjs',cases:['happy','edge']});
 const next=audit(m);
 assert.ok(!next.findings.some(f=>f.key==='go:behavior-happy:maps'));
 assert.ok(!next.findings.some(f=>f.key==='go:behavior-edge:maps'));
 assert.ok(next.findings.some(f=>f.key==='go:behavior-error:maps'));
});
test('unknown languages, stale evidence and failed independent probes are visible',()=>{
 const m=copy();delete m.languages.css;m.languages.go.evidence[0].card='deleted-card';m.languages.go.searches[0]={query:'goroutine',topic:'maps'};
 const r=audit(m);const keys=new Set(r.findings.map(f=>f.key));
 for(const k of ['css:profile:missing','go:stale-evidence:deleted-card','go:retrieval:search0'])assert.ok(keys.has(k),k);
});
test('invalid evidence and cursor markers cannot produce a successful audit',()=>{
 for(const mutate of [m=>m.languages.go.evidence[0].kind='pretend',m=>m.languages.go.evidence[0].cases=['whatever'],m=>m.languages.go.evidence.push(m.languages.go.evidence[0]),m=>m.languages.go.cursors[0].source='no cursor']){
 const m=copy();mutate(m);assert.throws(()=>audit(m));
 }
});
test('CLI reports JSON without hiding historical gaps; strict fails and freshness succeeds',()=>{
 const run=args=>spawnSync(process.execPath,['scripts/language-coverage.cjs',...args],{cwd:require('node:path').join(__dirname,'..'),encoding:'utf8'});
 const normal=run(['--json']);assert.equal(normal.status,0);assert.ok(JSON.parse(normal.stdout).findings.length);
 assert.equal(run(['--strict','--json']).status,1);
 assert.equal(run(['--check']).status,0);
 assert.notEqual(run(['--typo']).status,0);
 const runtime=spawnSync(process.execPath,['scripts/run-coverage-checks.cjs','shellscript'],{cwd:require('node:path').join(__dirname,'..'),encoding:'utf8'});
 assert.equal(runtime.status,1);assert.equal(JSON.parse(runtime.stdout).languages[0].status,'unregistered');
});
