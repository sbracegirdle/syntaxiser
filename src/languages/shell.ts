import { ContextInput, EditorContext, LanguageAdapter } from '../core/types';

// Retain only tool names and known subcommands, never arguments, output or paths.
const commands = new Set(['cd', 'pwd', 'ls', 'find', 'rg', 'grep', 'sort', 'uniq', 'wc', 'head', 'tail',
  'read', 'getopts', 'local', 'return', 'exit', 'trap', 'mktemp', 'sed', 'awk', 'cut', 'jq', 'xargs', 'wait',
  'tee', 'env', 'export', 'printf', 'test', 'for', 'while', 'git', 'cargo', 'go', 'gofmt',
  'pnpm', 'npm', 'npx', 'tsc', 'nvm', 'node', 'eslint', 'prettier', 'vitest', 'vite', 'curl', 'ps', 'pgrep', 'aws']);
const subcommands: Record<string, Set<string>> = {
  git: new Set(['status', 'diff', 'switch', 'branch', 'log', 'show', 'add', 'restore', 'stash', 'ls-files', 'merge', 'rebase']),
  cargo: new Set(['check', 'build', 'test', 'run', 'fmt', 'clippy']),
  go: new Set(['test', 'build', 'run', 'fmt', 'vet', 'mod', 'get']),
};

// One allowlist drives executed-command extraction and generated Zsh cases.
export const nodeOperations: Record<string, readonly string[]> = {
  pnpm: ['install', 'test', 'run', 'exec', 'dlx', 'add', 'remove', 'outdated', 'update', 'why', 'list', 'audit', 'pack'],
  npm: ['ci', 'install', 'test', 'run', 'exec', 'uninstall', 'outdated', 'update', 'explain', 'ls', 'audit', 'pack'],
  npx: [], nvm: ['install', 'use', 'current'],
  node: ['--test', '--watch', '--inspect', '--inspect-brk', '--env-file', '--check', '--eval', '--print'],
  tsc: ['--build', '--watch', '--showConfig', '--traceResolution', '--init'],
  eslint: [], prettier: [], vitest: ['run', 'watch'], vite: ['build', 'preview'],
};
export const nodeValueOptions: Record<string, readonly string[]> = {
  pnpm: ['--filter', '-F', '--dir', '-C'], npm: ['--workspace', '-w', '--prefix'],
  npx: [], nvm: [], node: ['--require', '-r', '--import', '--conditions', '-C'],
  tsc: ['--project', '-p', '--outDir', '--target', '--module', '--moduleResolution'],
  eslint: [], prettier: [], vitest: [], vite: [],
};
export const nodeFlagOptions: Record<string, readonly string[]> = {
  pnpm: ['--recursive', '-r', '--workspace-root', '-w'], npm: ['--workspaces'],
  npx: ['--no-install', '--yes', '-y'], nvm: [], node: ['--enable-source-maps'],
  tsc: ['--noEmit', '--pretty', '--incremental'], eslint: [], prettier: [], vitest: [], vite: [],
};
export const nodeOptionAliases: Record<string, string> = {
  'tsc:-b': '--build', 'tsc:-w': '--watch', 'node:-c': '--check',
  'node:-e': '--eval', 'node:-p': '--print',
};
export const localNodeTools = ['tsc', 'eslint', 'prettier', 'vitest', 'vite'];

function nodeCue(words: string[]): string {
  const tool = words[0]!;
  let index = 1;
  let workspace = '';
  while (words[index]?.startsWith('-')) {
    const raw = words[index]!;
    const option = raw.split('=')[0]!;
    const normalized = nodeOptionAliases[tool + ':' + option] ?? option;
    if (nodeOperations[tool]!.includes(normalized)) return tool + ' ' + normalized;
    if (nodeValueOptions[tool]!.includes(option)) {
      if (['--filter', '-F', '--workspace', '-w'].includes(option) && ['pnpm', 'npm'].includes(tool)) workspace = tool === 'pnpm' ? '--filter' : '--workspace';
      index += raw.includes('=') ? 1 : 2;
    } else if (nodeFlagOptions[tool]!.includes(option)) {
      if (['--recursive', '-r', '--workspaces'].includes(option) && ['pnpm', 'npm'].includes(tool)) workspace = tool === 'pnpm' ? '-r' : '--workspaces';
      index++;
    } else return tool;
  }
  const sub = words[index] ?? '';
  if ((['pnpm', 'npm'].includes(tool) && sub === 'exec') || tool === 'npx') {
    let executableIndex = tool === 'npx' ? index : index + 1;
    if (words[executableIndex] === '--') executableIndex++;
    const executable = words[executableIndex] ?? '';
    if (localNodeTools.includes(executable)) return nodeCue(words.slice(executableIndex));
  }
  if (workspace) return tool + ' ' + workspace;
  return nodeOperations[tool]!.includes(sub) ? tool + ' ' + sub : tool;
}

// Shared with the live Zsh hook: only these service/operation literals cross IPC.
export const awsOperations: Record<string, readonly string[]> = {
  configure: ['sso', 'list', 'list-profiles', 'get'], sso: ['login', 'logout'],
  sts: ['get-caller-identity', 'assume-role'],
  s3: ['ls', 'cp', 'sync', 'rm', 'mb', 'rb', 'mv', 'presign'],
  s3api: ['list-buckets', 'list-objects-v2', 'head-object', 'get-bucket-location'],
  ec2: ['describe-instances', 'describe-security-groups', 'describe-vpcs', 'wait', 'start-instances', 'stop-instances'],
  iam: ['list-roles', 'get-role', 'list-attached-role-policies', 'list-users'],
  logs: ['tail', 'filter-log-events', 'describe-log-groups'],
  lambda: ['list-functions', 'invoke', 'update-function-code', 'get-function-configuration'],
  cloudformation: ['deploy', 'describe-stacks', 'describe-stack-events', 'describe-change-set', 'wait'],
  dynamodb: ['list-tables', 'describe-table', 'get-item', 'query', 'scan', 'put-item'],
  ssm: ['get-parameter', 'get-parameters-by-path', 'start-session'],
  secretsmanager: ['list-secrets', 'describe-secret', 'get-secret-value'],
  ecr: ['get-login-password', 'describe-repositories', 'list-images', 'describe-images'],
  ecs: ['list-clusters', 'list-services', 'list-tasks', 'describe-services', 'describe-tasks', 'update-service', 'wait'],
  eks: ['list-clusters', 'describe-cluster', 'update-kubeconfig'],
  cloudwatch: ['list-metrics', 'get-metric-statistics', 'describe-alarms'],
};
export const awsValueOptions = ['--profile', '--region', '--output', '--query', '--endpoint-url', '--color',
  '--ca-bundle', '--cli-read-timeout', '--cli-connect-timeout', '--cli-binary-format'];
export const awsFlagOptions = ['--no-cli-pager', '--no-cli-auto-prompt', '--cli-auto-prompt',
  '--no-sign-request', '--no-paginate', '--debug'];

function awsCue(words: string[]): string {
  let index = 1;
  while (words[index]?.startsWith('--')) {
    const option = words[index]!.split('=')[0]!;
    if (awsValueOptions.includes(option)) index += words[index]!.includes('=') ? 1 : 2;
    else if (awsFlagOptions.includes(option)) index++;
    else return 'aws';
  }
  const service = words[index] ?? '';
  if (!Object.hasOwn(awsOperations, service)) return 'aws';
  const operation = words[index + 1] ?? '';
  return awsOperations[service]!.includes(operation) ? `aws ${service} ${operation}` : `aws ${service}`;
}

// Blank literal data while preserving offsets; no argument values cross the context boundary.
// This conservative scanner is not a shell evaluator: substitutions inside strings stay private.
export function maskShell(source: string): string {
  const chars = source.split('');
  const pending: { delimiter: string; tabs: boolean }[] = [];
  let quote = '', comment = false;
  const blank = (i: number) => { if (chars[i] !== '\n') chars[i] = ' '; };
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]!;
    if (ch === '\n') {
      comment = false;
      if (!quote && pending.length) {
        for (const heredoc of pending.splice(0)) {
          let cursor = i + 1;
          while (cursor < source.length) {
            let stop = source.indexOf('\n', cursor); if (stop < 0) stop = source.length;
            const line = source.slice(cursor, stop);
            for (let j = cursor; j < stop; j++) blank(j);
            i = stop; cursor = stop + 1;
            if ((heredoc.tabs ? line.replace(/^\t+/, '') : line) === heredoc.delimiter) break;
          }
        }
      }
      continue;
    }
    if (comment) { blank(i); continue; }
    if (quote) {
      blank(i);
      if (ch === '\\' && quote !== "'") { if (i + 1 < source.length) blank(++i); }
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '\\') { blank(i); if (i + 1 < source.length) blank(++i); continue; }
    if (ch === '#' && (i === 0 || /[\s;|&()]/.test(source[i - 1]!))) { comment = true; blank(i); continue; }
    if (source.startsWith('<<', i) && source[i + 2] !== '<' && source[i - 1] !== '<') {
      const match = source.slice(i).match(/^<<(-?)\s*(?:'([A-Za-z_][A-Za-z0-9_]*)'|"([A-Za-z_][A-Za-z0-9_]*)"|([A-Za-z_][A-Za-z0-9_]*))/);
      if (match) {
        pending.push({ delimiter: (match[2] || match[3] || match[4])!, tabs: match[1] === '-' });
        for (let j = 0; j < match[0].length; j++) blank(i + j);
        i += match[0].length - 1; continue;
      }
    }
    if (ch === "'" || ch === '"' || ch === '\x60') { quote = ch; blank(i); }
  }
  return chars.join('');
}

function cuesFromMasked(source: string): string {
  const cues: string[] = [];
  if (/\b[A-Za-z_][A-Za-z0-9_]*\s*\(\s*\)\s*\{/.test(source)) cues.push('shell function');
  if (/\b[A-Za-z_][A-Za-z0-9_]*=\(/.test(source)) cues.push('shell array');
  if (/\bset\s+(?:-o\s+|-[a-z]*o\s+)pipefail\b/.test(source)) cues.push('pipefail');
  for (const segment of source.split(/[\n;|&(){}]/)) {
    const words = segment.trim().split(/\s+/);
    while (['if','then','else','elif','do','!'].includes(words[0] ?? '')) words.shift();
    if (words[0] === 'while' && words.length > 1) words.shift();
    while (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0] ?? '')) words.shift();
    if (words[0] === 'sudo' || words[0] === 'command') words.shift();
    const command = words[0] ?? '';
    if (!commands.has(command)) continue;
    if (Object.hasOwn(nodeOperations, command)) { cues.push(nodeCue(words)); continue; }
    if (command === 'aws') { cues.push(awsCue(words)); continue; }
    const subcommand = subcommands[command]?.has(words[1] ?? '') ? words[1] : '';
    cues.push(subcommand ? command + ' ' + subcommand : command);
  }
  return [...new Set(cues)].join('\n');
}

export function shellCues(source: string): string {
  return cuesFromMasked(maskShell(source.slice(0, 4096)));
}

export const shellAdapter: LanguageAdapter = {
  languageId: 'shellscript',
  extract(input: ContextInput): EditorContext {
    const offset = Math.max(0, Math.min(input.offset, input.text.length));
    const start = input.text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
    const end = input.text.indexOf('\n', offset);
    const masked = maskShell(input.text);
    const currentLine = cuesFromMasked(masked.slice(start, end < 0 ? undefined : end));
    return { languageId: 'shellscript', scope: 'block', currentLine, focus: currentLine,
      local: currentLine, imports: '', symbols: '', recentEdits: '',
      cues: currentLine ? [] : ['navigation', 'search', 'git status'] };
  },
};
