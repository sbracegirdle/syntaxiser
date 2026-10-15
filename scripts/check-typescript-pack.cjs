const ts = require('typescript');
const { existsSync, mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { cards } = require('../packs/typescript.json');

// Check each example as an independent strict module, without executing any code.
const libraryRoot = join(__dirname, '..', 'playground', 'typescript', 'libraries');
if (!existsSync(join(libraryRoot, 'node_modules', 'typescript'))) {
  throw new Error('Install example dependencies first: pnpm --dir playground/typescript/libraries install');
}
// Resolve genuine installed library declarations, including JSX and test-runner APIs.
const directory = mkdtempSync(join(libraryRoot, '.catalog-'));
try {
  writeFileSync(join(directory, 'models.ts'), 'export interface User { name: string }\n');
  const files = cards.map(card => {
    const file = join(directory, `${card.id}.tsx`);
    writeFileSync(file, `export {};\n${card.code}\n`);
    return file;
  });
  const program = ts.createProgram(files, {
    strict: true, noEmit: true, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, skipLibCheck: true,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
    types: ['node', 'react'], typeRoots: [join(libraryRoot, 'node_modules', '@types')],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => directory, getCanonicalFileName: file => file, getNewLine: () => '\n',
    }));
    process.exitCode = 1;
  } else console.log(`Strict type-check passed for ${cards.length} TypeScript examples.`);
} finally { rmSync(directory, { recursive: true, force: true }); }
