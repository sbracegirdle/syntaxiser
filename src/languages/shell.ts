import { ContextInput, EditorContext, LanguageAdapter } from '../core/types';

// Retain only tool names and known subcommands, never arguments, output or paths.
const commands = new Set(['cd', 'pwd', 'ls', 'find', 'rg', 'grep', 'sort', 'uniq', 'wc', 'head', 'tail',
  'tee', 'env', 'export', 'printf', 'test', 'for', 'while', 'git', 'cargo', 'go', 'gofmt',
  'pnpm', 'npm', 'npx', 'tsc', 'nvm', 'node', 'eslint', 'prettier', 'vitest', 'vite', 'curl', 'ps', 'pgrep', 'aws']);
const subcommands: Record<string, Set<string>> = {
  git: new Set(['status', 'diff', 'switch', 'branch', 'log', 'show']),
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

export function shellCues(source: string): string {
  const segments = source.slice(0, 4096).replace(/#[^\n]*/g, '').split(/[\n;|&()]/);
  const cues: string[] = [];
  for (const segment of segments) {
    const words = segment.trim().split(/\s+/);
    while (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0] ?? '')) words.shift();
    if (words[0] === 'sudo' || words[0] === 'command') words.shift();
    const command = words[0] ?? '';
    if (!commands.has(command)) continue;
    if (Object.hasOwn(nodeOperations, command)) { cues.push(nodeCue(words)); continue; }
    if (command === 'aws') { cues.push(awsCue(words)); continue; }
    const subcommand = subcommands[command]?.has(words[1] ?? '') ? words[1] : '';
    cues.push(subcommand ? `${command} ${subcommand}` : command);
  }
  return [...new Set(cues)].join('\n');
}

export const shellAdapter: LanguageAdapter = {
  languageId: 'shellscript',
  extract(input: ContextInput): EditorContext {
    const offset = Math.max(0, Math.min(input.offset, input.text.length));
    const start = input.text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
    const end = input.text.indexOf('\n', offset);
    const currentLine = shellCues(input.text.slice(start, end < 0 ? undefined : end));
    return { languageId: 'shellscript', scope: 'block', currentLine, focus: currentLine,
      local: currentLine, imports: '', symbols: '', recentEdits: '',
      cues: currentLine ? [] : ['navigation', 'search', 'git status'] };
  },
};
