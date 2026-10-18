// Local release preparation never contacts the Marketplace.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const yauzl = require('yauzl');

const usage = `Usage:
  pnpm release:prepare
  pnpm release:publish --confirm publisher.name@version --sha256 <reviewed checksum> [--auth pat|azure]

prepare tests, packages and inspects a clean checkout without credentials.
publish uploads that exact package from clean main; it never rebuilds or bumps versions.
Artifacts and the release receipt are saved in .release/.`;

function parseArgs(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) return { help: true };
  const [command, ...rest] = args;
  if (!['prepare', 'publish'].includes(command)) throw Error(usage);
  const options = { command, auth: 'pat' };
  while (rest.length) {
    const flag = rest.shift();
    if (!['--confirm', '--sha256', '--auth'].includes(flag) || !rest.length || rest[0].startsWith('--')) {
      throw Error(`Unknown or incomplete option: ${flag}`);
    }
    const key = flag.slice(2);
    if (Object.hasOwn(options, key) && key !== 'auth') throw Error(`Duplicate option: ${flag}`);
    options[key] = rest.shift();
  }
  if (command === 'prepare' && args.length !== 1) throw Error('prepare takes no options.');
  if (!['pat', 'azure'].includes(options.auth)) throw Error('Authentication must be pat or azure.');
  if (command === 'publish' && (!options.confirm || !/^[a-f0-9]{64}$/.test(options.sha256 || ''))) {
    throw Error('Publishing requires --confirm publisher.name@version and --sha256 <reviewed checksum>.');
  }
  return options;
}

function buildEnvironment(env) {
  return Object.fromEntries(Object.entries(env).filter(([key]) =>
    !/^(VSCE_|AZURE_|ACTIONS_|GH_TOKEN$|GITHUB_TOKEN$|NPM_TOKEN$|NODE_OPTIONS$)/i.test(key)));
}

function run(root, command, args, { publishing = false, env = process.env } = {}) {
  const result = spawnSync(command, args, {
    cwd: root, env: publishing ? env : buildEnvironment(env),
    stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 10 * 60 * 1000,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    // Authentication libraries and remote error bodies can contain credentials.
    if (publishing) throw Error('Marketplace upload failed. Check publisher permissions, authentication and whether this version already exists; no credential output was retained.');
    throw Error(`${command} ${args.join(' ')} failed.\n${result.error?.message || result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function sourceState(root, execute) {
  if (execute('git', ['status', '--porcelain', '--untracked-files=all'])) {
    throw Error('Use a clean checkout, including untracked files. Commit release metadata and dependency locks first.');
  }
  return {
    commit: execute('git', ['rev-parse', 'HEAD']),
    branch: execute('git', ['branch', '--show-current']),
  };
}

function identity(manifest) {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(manifest.publisher || '') ||
      !/^[a-z0-9][a-z0-9-]*$/i.test(manifest.name || '') ||
      !/^\d+\.\d+\.\d+$/.test(manifest.version || '')) {
    throw Error('Release requires a publisher, extension name and stable x.y.z version in package.json.');
  }
  return `${manifest.publisher}.${manifest.name}@${manifest.version}`;
}

function checkFiles(files) {
  const allowed = /^(package\.json|README\.md|LICENSE(?:\.txt)?|CHANGELOG\.md|THIRD_PARTY_NOTICES\.md|out\/[A-Za-z0-9_/-]+\.js|packs\/[a-z0-9-]+\.json|media\/[a-z0-9-]+\.(?:js|css|svg|png))$/;
  if (new Set(files).size !== files.length) throw Error('Duplicate package entries.');
  for (const file of files) {
    if (!allowed.test(file) || file.split('/').some(part => part === '..')) throw Error(`Unexpected package file: ${file}`);
  }
  for (const required of ['package.json', 'README.md', 'THIRD_PARTY_NOTICES.md', 'out/extension.js',
    'media/sidebar.js', 'media/lessons.js', 'media/sidebar.css', 'media/highlight.js', 'media/reference.svg']) {
    if (!files.includes(required)) throw Error(`Package is missing ${required}`);
  }
  if (!files.some(file => /^LICENSE/.test(file))) throw Error('Package is missing LICENSE');
}

async function inspectVsix(filename) {
  const zip = await new Promise((resolve, reject) => yauzl.open(filename, { lazyEntries: true }, (error, value) => error ? reject(error) : resolve(value)));
  return new Promise((resolve, reject) => {
    const files = [];
    let manifest;
    const fail = error => { zip.close(); reject(error); };
    zip.on('error', fail);
    zip.on('end', () => {
      try {
        checkFiles(files);
        if (!manifest) throw Error('VSIX is missing its extension manifest.');
        resolve({ files: files.sort(), manifest });
      } catch (error) { fail(error); }
    });
    zip.on('entry', entry => {
      if (files.length > 5000 || entry.uncompressedSize > 100 * 1024 * 1024) return fail(Error('Unexpected VSIX size.'));
      if (['[Content_Types].xml', 'extension.vsixmanifest'].includes(entry.fileName)) return zip.readEntry();
      if (!entry.fileName.startsWith('extension/')) return fail(Error(`Unexpected VSIX entry: ${entry.fileName}`));
      files.push(entry.fileName.slice('extension/'.length));
      if (entry.fileName !== 'extension/package.json') return zip.readEntry();
      zip.openReadStream(entry, (error, stream) => {
        if (error) return fail(error);
        const chunks = [];
        stream.on('error', fail);
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => {
          try { manifest = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
          catch (error) { return fail(error); }
          zip.readEntry();
        });
      });
    });
    zip.readEntry();
  });
}

const sha256 = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');

async function release(options, { root = path.resolve(__dirname, '..'), env = process.env,
  execute = (command, args, config) => run(root, command, args, { env, ...config }), inspect = inspectVsix } = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const id = identity(manifest);
  const source = sourceState(root, execute);
  const directory = path.join(root, '.release');
  const artifact = `${manifest.name}-${manifest.version}.vsix`;
  const filename = path.join(directory, artifact);
  const receiptPath = path.join(directory, 'release.json');
  if (options.command === 'prepare') {
    fs.mkdirSync(directory, { recursive: true });
    // Invalidate prior evidence before doing anything that might fail.
    fs.rmSync(receiptPath, { force: true });
    fs.rmSync(filename, { force: true });
    fs.rmSync(path.join(root, 'out'), { force: true, recursive: true });
    fs.rmSync(path.join(root, 'media/highlight.js'), { force: true });
    const node = execute('node', ['--version']);
    if (node !== `v${fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim()}`) throw Error('Run nvm use before preparing a release.');
    const pnpm = execute('pnpm', ['--version']);
    execute('pnpm', ['install', '--frozen-lockfile', '--ignore-scripts']);
    const checks = [
      ['pnpm', ['test']], ['pnpm', ['audit:coverage', '--check']],
      ['node', ['scripts/lesson-coverage.cjs', '--check']],
    ];
    for (const [command, args] of checks) {
      console.log(`Checking: ${command} ${args.join(' ')}`);
      execute(command, args);
    }
    execute('pnpm', ['exec', 'vsce', 'package', '--no-dependencies', '--out', filename]);
    const inspected = await inspect(filename);
    if (identity(inspected.manifest) !== id) throw Error('Packaged identity differs from source.');
    const required = fs.readdirSync(path.join(root, 'packs')).filter(file => file.endsWith('.json')).map(file => `packs/${file}`);
    for (const file of required) if (!inspected.files.includes(file)) throw Error(`Package is missing catalog ${file}`);
    const after = sourceState(root, execute);
    if (source.commit !== after.commit || source.branch !== after.branch) throw Error('Source changed during preparation.');
    const receipt = {
      schema: 1, identity: id, artifact, sha256: sha256(filename), ...source,
      preparedAt: new Date().toISOString(), node, pnpm,
      vsce: execute('pnpm', ['exec', 'vsce', '--version']),
      checks: checks.map(([command, args]) => `${command} ${args.join(' ')}`), files: inspected.files,
    };
    fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
    console.log(`Prepared ${id}\nVSIX: ${filename}\nSHA-256: ${receipt.sha256}\nInspect .release/release.json and manually test the VSIX before publishing.`);
    return receipt;
  }
  if (source.branch !== 'main') throw Error('Publish only from clean main, after the release change has merged.');
  if (options.confirm !== id) throw Error(`Confirmation must match ${id}`);
  const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  if (receipt.schema !== 1 || receipt.identity !== id || receipt.artifact !== artifact || receipt.commit !== source.commit) {
    throw Error('Release receipt does not match this source. Prepare again on main and review the new artifact.');
  }
  if (receipt.sha256 !== options.sha256 || sha256(filename) !== options.sha256) throw Error('Reviewed checksum does not match the prepared VSIX.');
  const inspected = await inspect(filename);
  if (identity(inspected.manifest) !== id || JSON.stringify(inspected.files) !== JSON.stringify(receipt.files)) throw Error('VSIX content differs from the release receipt.');
  const args = ['exec', 'vsce', 'publish', '--packagePath', filename];
  if (options.auth === 'azure') {
    if (env.VSCE_PAT) throw Error('Unset VSCE_PAT when selecting Azure authentication.');
    args.push('--azure-credential');
  } else if (!env.VSCE_PAT?.trim()) {
    throw Error('Provide VSCE_PAT privately in the environment, or select --auth azure. Never pass a token as an argument.');
  }
  execute('pnpm', args, { publishing: true });
  console.log(`Published ${id}. Verify https://marketplace.visualstudio.com/items?itemName=${manifest.publisher}.${manifest.name}`);
}

if (require.main === module) {
  Promise.resolve().then(() => {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) return console.log(usage);
    return release(options);
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { parseArgs, buildEnvironment, checkFiles, inspectVsix, release, run };
