const { spawnSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { cards } = require('../packs/go.json');
const directory = mkdtempSync(join(tmpdir(), 'syntaxiser-go-'));
try {
  for (const card of cards) {
    const candidates = card.code.startsWith('package ') ? [card.code] : [
      `package example\n${card.code}\n`,
      `package example\nfunc example() {\n${card.code}\n}\n`,
    ];
    const results = [];
    for (const input of candidates) {
      const file = join(directory, 'snippet.go');
      writeFileSync(file, input);
      const result = spawnSync('gofmt', [file], { encoding: 'utf8', timeout: 10_000 });
      if (result.error) throw result.error;
      results.push(result);
      if (result.status === 0) break;
    }
    if (!results.some(result => result.status === 0)) {
      console.error(`${card.id}: ${results.at(-1).stderr}`);
      process.exitCode = 1;
    }
  }
  if (!process.exitCode) console.log(`Parsed ${cards.length} Go snippets with gofmt.`);
} finally { rmSync(directory, { recursive: true, force: true }); }

// Parsing is reported independently; new standard-library cards require real behavior.
if (!process.exitCode) {
  const result = spawnSync(process.execPath, [require("node:path").join(__dirname, "check-go-standard-library.cjs")], { stdio: "inherit", timeout: 240_000 });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = 1;
}
