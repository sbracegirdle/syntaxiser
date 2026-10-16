// Deterministic inventory and real adapter/retrieval probes; no network or ticket writes.
const fs = require('node:fs');
const path = require('node:path');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const adapters = Object.assign({}, ...['rust','go','typescript','javascript','python','java','web','sql','yaml','shell']
  .map(name => require('../out/languages/' + name)));
function audit(manifest = read('coverage/languages.json'), load = id => read('packs/' + id + '.json'), refs = id => read('packs/' + id + '-reference.json')) {
  const findings = [];
  const add = (language, rule, target, detail) => findings.push({ key: `${language}:${rule}:${target}`, language, rule, target, detail });
  const languages = [];
  if (manifest.schemaVersion !== 1 || !manifest.languages || Array.isArray(manifest.languages)) throw Error('Invalid coverage manifest');
  const discovered = fs.readdirSync(path.join(root, 'packs')).filter(file => file.endsWith('-reference.json')).map(file => file.replace('-reference.json',''));
  for (const id of discovered) if (!manifest.languages[id]) add(id, 'profile', 'missing', 'Supported catalog has no coverage profile.');
  for (const [id, profile] of Object.entries(manifest.languages).sort()) {
    if (!Array.isArray(profile.requiredTopics) || !profile.requiredTopics.length || !Array.isArray(profile.ecosystemTopics) || !profile.ecosystemTopics.length || !Array.isArray(profile.searches) || !Array.isArray(profile.cursors) || !Array.isArray(profile.evidence)) throw Error(`Invalid profile: ${id}`);
    const pack = validatePack({ ...load(id), referenceTopics: refs(id) });
    const retriever = new Retriever(pack);
    const topics = new Set(pack.concepts.map(c => c.id));
    const overview = new Map(pack.referenceTopics.map(t => [t.id,t]));
    const grouped = new Set((pack.referenceGroups || []).flatMap(g => g.topics));
    for (const topic of new Set([...profile.requiredTopics, ...profile.ecosystemTopics, ...topics])) {
      if (!topics.has(topic)) { add(id,'topic',topic,'Required core/ecosystem topic is absent.'); continue; }
      const cards = pack.cards.filter(c => c.topics.includes(topic));
      const ref = overview.get(topic);
      if (!cards.length) add(id,'example',topic,'No practical example.');
      if (!grouped.has(topic)) add(id,'group',topic,'Topic absent from reference navigation.');
      if (!ref) add(id,'overview',topic,'No separate syntax/API overview.');
      else {
        if (cards.some(c => c.code.trim() === ref.syntax.trim())) add(id,'separation',topic,'Overview duplicates practical code.');
        if (!ref.references?.some(r => /^https:\/\//.test(r.url))) add(id,'source',topic,'No HTTPS learning source; authority requires reviewer judgment.');
      }
      for (const situation of ['happy','edge','error']) {
        if (!profile.evidence.some(e => e.kind === 'behavior' && e.cases.includes(situation) && cards.some(c => c.id === e.card)))
          add(id,'behavior-'+situation,topic,`No registered ${situation} behavioral assertion for this topic (not proof tests are absent).`);
      }
    }
    for (const card of pack.cards) if (!card.explanation?.trim()) add(id,'explanation',card.id,'Practical example lacks context/assumptions.');
    if (!profile.playground || !fs.existsSync(path.join(root,profile.playground))) add(id,'playground','instructions','Runnable setup/manual instructions missing.');
    const packageScripts = read('package.json').scripts;
    if (!profile.command || !packageScripts[profile.command]) add(id,'runtime-command','missing','No registered real-toolchain package command.');
    const registered = new Set();
    for (const e of profile.evidence) {
      if (!['parse','typecheck','execute','behavior'].includes(e.kind) || !Array.isArray(e.cases) || !e.cases.length || e.cases.some(c => !['happy','edge','error'].includes(c))) throw Error(`Invalid evidence: ${id}/${e.card}`);
      if (!pack.cards.some(c => c.id === e.card) || !e.source || !fs.existsSync(path.join(root,e.source))) add(id,'stale-evidence',e.card,'Evidence card or source no longer exists.');
      const key = `${e.card}:${e.kind}`;
      if (registered.has(key)) throw Error('Duplicate evidence: '+id+'/'+key);
      registered.add(key);
    }
    const adapter = adapters[(id === 'shellscript' ? 'shell' : id) + 'Adapter'];
    let passed = 0;
    for (const [kind, probes] of [['search',profile.searches],['cursor',profile.cursors]]) {
      if (probes.length < 2) add(id,'probes',kind,'At least two independently authored probes required.');
      for (const [index,probe] of probes.entries()) {
        if (!topics.has(probe.topic)) { add(id,'probe-topic',kind+index,'Expected topic absent.'); continue; }
        let hits;
        if (kind === 'search') {
          if (typeof probe.query !== 'string' || !probe.query.trim()) throw Error('Empty search probe');
          hits = retriever.search(probe.query,3);
        } else {
          if (typeof probe.source !== 'string' || probe.source.split('|').length !== 2) throw Error('Cursor fixture needs exactly one | marker');
          const offset = probe.source.indexOf('|');
          hits = retriever.relevant(adapter.extract({ text: probe.source.replace('|',''),offset,symbols:[],recentEdits:[],filePath:probe.filePath }),3);
        }
        if (hits.some(h => h.card.topics.includes(probe.topic))) passed++;
        else add(id,'retrieval',kind+index,`Expected ${probe.topic} in top three; got ${hits.map(h=>h.card.id).join(', ')}.`);
      }
    }
    languages.push({language:id,topics:topics.size,cards:pack.cards.length,overviews:overview.size,probesPassed:passed,probes:profile.searches.length+profile.cursors.length,
      evidence: Object.fromEntries(['parse','typecheck','execute','behavior'].map(kind=>[kind,new Set(profile.evidence.filter(e=>e.kind===kind).map(e=>e.card)).size])), runtimeCommand:profile.command, runtimeStatus:'not-run'});
  }
  findings.sort((a,b)=>a.key.localeCompare(b.key));
  return {schemaVersion:1,languages,findings};
}
function markdown(report) {
  const groups = new Map();
  for (const finding of report.findings) {
    const key = finding.language + ':' + finding.rule;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(finding);
  }
  return ['# Language coverage audit','', 'Generated by `pnpm audit:coverage`. Registration is not execution; absent evidence means unknown, not a proven broken example. Runtime checks are run separately and their logs/revision must accompany review.','',
    '| Context | Topics | Examples | Overviews | Probes passed | Parse registered | Typecheck registered | Execute registered | Behavior registered |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...report.languages.map(l=>`| ${l.language} | ${l.topics} | ${l.cards} | ${l.overviews} | ${l.probesPassed}/${l.probes} | ${l.evidence.parse} | ${l.evidence.typecheck} | ${l.evidence.execute} | ${l.evidence.behavior} |`),'',
    '## Findings','', 'Full findings with stable keys: `pnpm audit:coverage --json`. The table groups unknown evidence for triage rather than producing one ticket per topic.', '', '| Context / rule | Count | Example targets (up to three) |', '| --- | ---: | --- |', ...[...groups].map(([key, items]) => `| ${key} | ${items.length} | ${items.slice(0,3).map(f=>f.target).join(", ")} |`),'', 'See [review standard](language-coverage-standard.md) for acceptance criteria and daily triage.',''].join('\n');
}
if (require.main === module) {
  const args=process.argv.slice(2);
  if (args.some(a=>!['--json','--write','--strict','--check'].includes(a))) throw Error('Options: --json --write --strict --check');
  const report=audit(); const text=markdown(report); const target=path.join(root,'docs/language-coverage.md');
  if(args.includes('--write')) fs.writeFileSync(target,text);
  else if(args.includes('--check')) { if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==text) { console.error('Coverage report stale: pnpm audit:coverage --write'); process.exitCode=1; } }
  else console.log(args.includes('--json')?JSON.stringify(report,null,2):text);
  if(args.includes('--strict')&&report.findings.length) process.exitCode=1;
}
module.exports={audit,markdown};
