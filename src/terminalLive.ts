import * as vscode from 'vscode';
import { promises as fs, watch, FSWatcher } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { shellCues } from './languages/shell';

const quote = (value: string) => "'" + value.replace(/'/g, "'\\''") + "'";

/** A ZLE hook publishes only allowlisted command cues, never the editable buffer. */
export function liveZshHook(directory: string): string {
  return `
autoload -Uz add-zle-hook-widget
_syntaxiser_live_context() {
  emulate -L zsh
  setopt no_shwordsplit
  local -a words
  words=(\${=BUFFER})
  local tool=\${words[1]} sub=\${words[2]} cue=''
  case "$tool" in
    cd|pwd|ls|find|rg|grep|sort|uniq|wc|head|tail|tee|env|export|printf|test|for|while|git|cargo|go|gofmt|pnpm|npm|npx|tsc|nvm|node|curl|ps|pgrep) cue="$tool" ;;
  esac
  case "$tool:$sub" in
    git:status|git:diff|git:switch|git:branch|git:log|git:show|cargo:check|cargo:build|cargo:test|cargo:run|cargo:fmt|cargo:clippy|go:test|go:build|go:run|go:fmt|go:vet|go:mod|go:get|pnpm:install|pnpm:test|pnpm:run|pnpm:exec|npm:ci|npm:install|npm:test|npm:run) cue="$tool $sub" ;;
  esac
  if [[ "$cue" != "\${_syntaxiser_previous_cue-__unset__}" ]]; then
    typeset -g _syntaxiser_previous_cue="$cue"
    print -rn -- "$cue" > ${quote(directory)}/$$.cue 2>/dev/null
  fi
}
add-zle-hook-widget line-pre-redraw _syntaxiser_live_context
add-zle-hook-widget line-init _syntaxiser_live_context
`;
}

export class LiveTerminalContext implements vscode.Disposable {
  private watcher?: FSWatcher;
  private directory?: string;
  private disposed = false;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly environment: vscode.EnvironmentVariableCollection,
    private readonly update: (terminal: vscode.Terminal, cues: string) => void) {}

  async start(): Promise<void> {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'syntaxiser-zsh-'));
    this.directory = directory;
    await fs.chmod(directory, 0o700);
    const original = process.env.ZDOTDIR || os.homedir();
    // System startup files still run normally. Restore ZDOTDIR while user files run.
    const restore = process.env.ZDOTDIR ? `export ZDOTDIR=${quote(original)}` : 'unset ZDOTDIR';
    await fs.writeFile(path.join(directory, '.zshenv'), `${restore}\n[[ -r ${quote(path.join(original, '.zshenv'))} ]] && source ${quote(path.join(original, '.zshenv'))}\nexport ZDOTDIR=${quote(directory)}\n`);
    await fs.writeFile(path.join(directory, '.zshrc'), `${restore}\n[[ -r ${quote(path.join(original, '.zshrc'))} ]] && source ${quote(path.join(original, '.zshrc'))}\n${liveZshHook(directory)}`);
    for (const name of ['.zprofile', '.zlogin', '.zlogout']) {
      await fs.writeFile(path.join(directory, name), `${restore}\n[[ -r ${quote(path.join(original, name))} ]] && source ${quote(path.join(original, name))}\n${name === '.zlogout' ? '' : `export ZDOTDIR=${quote(directory)}`}\n`);
    }
    if (this.disposed) { await fs.rm(directory, { recursive: true, force: true }); return; }
    this.watcher = watch(directory, (_event, file) => {
      const name = file?.toString() ?? '';
      if (!/^\d+\.cue$/.test(name)) return;
      const old = this.timers.get(name);
      if (old) clearTimeout(old);
      this.timers.set(name, setTimeout(() => {
        this.timers.delete(name);
        void this.read(directory, name);
      }, 100));
    });
    this.environment.persistent = false;
    this.environment.replace('ZDOTDIR', directory);
  }

  private async read(directory: string, name: string): Promise<void> {
    try {
      const text = await fs.readFile(path.join(directory, name), 'utf8');
      if (this.disposed || text.length > 100) return;
      const pid = Number(name.slice(0, -4));
      const terminals = vscode.window.terminals;
      for (const terminal of terminals) {
        if (await terminal.processId === pid && !this.disposed) {
          // Validate even the private IPC payload before it reaches retrieval.
          this.update(terminal, shellCues(text));
          break;
        }
      }
    } catch { /* A terminal or extension may close while a cue is being read. */ }
  }

  dispose(): void {
    this.disposed = true;
    this.watcher?.close();
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.environment.delete('ZDOTDIR');
    if (this.directory) void fs.rm(this.directory, { recursive: true, force: true }).catch(() => {});
  }
}
