// Explicit opt-in: real pinned toolchains may need dependency installation and local services.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname,'..');
const profiles = require('../coverage/languages.json').languages;
function summarize(command, result) {
  const summary = {command,status:result.status===0&&!result.error?'passed':'failed',exitCode:result.status,error:result.error?.message,output:(result.stdout||'')+(result.stderr||'')};
  if (command === 'check:shell' && !result.error) {
    const line = (result.stdout || '').split('\n').find(line => line.startsWith('SYNTAXISER_RUNTIME_REPORT='));
    try {
      const detail = JSON.parse(line?.slice('SYNTAXISER_RUNTIME_REPORT='.length));
      const { aggregate } = require('./check-shell-pack.cjs');
      if (!Array.isArray(detail.families) || detail.families.length !== 4 || !['bash','shell-depth','node-cli','aws'].every((name, index) => detail.families[index].name === name && detail.families[index].optional === (name === 'aws') && ['passed','failed','unavailable'].includes(detail.families[index].status))) throw Error('Invalid shell families');
      const status = aggregate(detail.families);
      if (detail.status !== status || result.status !== ({passed:0,failed:1,unavailable:2})[status]) throw Error('Shell report/exit mismatch');
      summary.status = status;
      summary.families = detail.families;
    } catch (error) { summary.status = 'failed'; summary.error = 'Invalid shell runtime report: ' + error.message; }
  }
  return summary;
}
function main() {
const args = process.argv.slice(2);
if (args.length > 1 || (args[0] && !profiles[args[0]])) throw Error('Usage: node scripts/run-coverage-checks.cjs [languageId]');
const languages = args[0] ? [args[0]] : Object.keys(profiles).sort();
const revision = spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
const results = new Map();
const report = {schemaVersion:1,revision,startedAt:new Date().toISOString(),languages:[]};
for (const language of languages) {
  const command = profiles[language].command;
  const contentHash = createHash('sha256').update(fs.readFileSync(path.join(root,`packs/${language}.json`))).update(fs.readFileSync(path.join(root,`packs/${language}-reference.json`))).update(fs.readFileSync(path.join(root,'coverage/languages.json'))).digest('hex');
  if (!command) { report.languages.push({language,contentHash,status:'unregistered'}); continue; }
  if (!/^check:[a-z:]+$/.test(command) || !require('../package.json').scripts[command]) throw Error('Invalid runtime command: '+command);
  if (!results.has(command)) {
    const result=spawnSync('pnpm',['--config.verify-deps-before-run=false','run',command],{cwd:root,encoding:'utf8',timeout:600_000,maxBuffer:20*1024*1024});
    results.set(command,summarize(command,result));
  }
  report.languages.push({language,contentHash,...results.get(command)});
}
report.finishedAt = new Date().toISOString();
console.log(JSON.stringify(report,null,2));
if(report.languages.some(l=>l.status!=='passed')) process.exitCode=1;

}
if (require.main === module) main();
module.exports = { summarize };
