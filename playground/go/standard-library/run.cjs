// This entry point also works through the primary-checkout playground symlink.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const checker = require('../../../scripts/check-go-standard-library.cjs');
if (process.argv[2] === '--export' && process.argv.length === 4) {
  checker.generate(path.resolve(process.argv[3]));
  console.log('Exported exact catalog fixtures to ' + path.resolve(process.argv[3]));
} else if (process.argv.length === 2) {
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../../../scripts/check-go-pack.cjs')], { stdio: 'inherit', timeout: 300_000 });
  if (result.error) throw result.error;
  process.exitCode = result.status === 0 ? 0 : 1;
} else { throw Error('Usage: node run.cjs [--export destination]'); }
