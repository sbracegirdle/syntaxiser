const ts = require('typescript');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { cards } = require('../packs/typescript.json');

// Check each example as an independent strict module, without executing any code.
const directory = mkdtempSync(join(tmpdir(), 'syntaxiser-typescript-'));
try {
  writeFileSync(join(directory, 'models.ts'), 'export interface User { name: string }\n');
  const files = cards.map(card => {
    const file = join(directory, `${card.id}.ts`);
    writeFileSync(file, `export {};\n${card.code}\n`);
    return file;
  });
  const program = ts.createProgram(files, {
    strict: true, noEmit: true, types: [], target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => directory, getCanonicalFileName: file => file, getNewLine: () => '\n',
    }));
    process.exitCode = 1;
  } else console.log(`Strict type-check passed for ${cards.length} TypeScript examples.`);
} finally { rmSync(directory, { recursive: true, force: true }); }
