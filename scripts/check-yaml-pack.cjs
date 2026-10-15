// Validate the actual catalog text rather than separately maintained copies.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'syntaxiser-yaml-'));
try {
  fs.copyFileSync(path.join(root, 'packs/yaml.json'), path.join(temp, 'pack.json'));
  const result = spawnSync(process.env.UV || 'uv', ['run', '--locked', '--project', path.join(root, 'playground/yaml'),
    path.join(root, 'playground/yaml/verify.py'), temp], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
