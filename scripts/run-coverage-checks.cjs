// Explicit opt-in: real pinned toolchains may need dependency installation and local services.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname,'..');
const profiles = require('../coverage/languages.json').languages;
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
    results.set(command,{command,status:result.status===0&&!result.error?'passed':'failed',exitCode:result.status,error:result.error?.message,output:(result.stdout||'')+(result.stderr||'')});
  }
  report.languages.push({language,contentHash,...results.get(command)});
}
report.finishedAt = new Date().toISOString();
console.log(JSON.stringify(report,null,2));
if(report.languages.some(l=>l.status!=='passed')) process.exitCode=1;
