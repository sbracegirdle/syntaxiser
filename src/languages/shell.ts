import { ContextInput, EditorContext, LanguageAdapter } from '../core/types';

// Retain only tool names and known subcommands, never arguments, output or paths.
const commands = new Set(['cd', 'pwd', 'ls', 'find', 'rg', 'grep', 'sort', 'uniq', 'wc', 'head', 'tail',
  'tee', 'env', 'export', 'printf', 'test', 'for', 'while', 'git', 'cargo', 'go', 'gofmt',
  'pnpm', 'npm', 'npx', 'tsc', 'nvm', 'node', 'curl', 'ps', 'pgrep']);
const subcommands: Record<string, Set<string>> = {
  git: new Set(['status', 'diff', 'switch', 'branch', 'log', 'show']),
  cargo: new Set(['check', 'build', 'test', 'run', 'fmt', 'clippy']),
  go: new Set(['test', 'build', 'run', 'fmt', 'vet', 'mod', 'get']),
  pnpm: new Set(['install', 'test', 'run', 'exec']), npm: new Set(['ci', 'install', 'test', 'run']),
};

export function shellCues(source: string): string {
  const segments = source.slice(0, 4096).replace(/#[^\n]*/g, '').split(/[\n;|&()]/);
  const cues: string[] = [];
  for (const segment of segments) {
    const words = segment.trim().split(/\s+/);
    while (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0] ?? '')) words.shift();
    if (words[0] === 'sudo' || words[0] === 'command') words.shift();
    const command = words[0] ?? '';
    if (!commands.has(command)) continue;
    const subcommand = subcommands[command]?.has(words[1] ?? '') ? words[1] : '';
    cues.push(subcommand ? `${command} ${subcommand}` : command);
    if ((command === 'pnpm' && words[1] === 'exec' || command === 'npx') && words.includes('tsc')) cues.push('tsc');
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
