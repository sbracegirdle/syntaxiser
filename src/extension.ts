import * as vscode from 'vscode';
import { validatePack } from './core/pack';
import { ReferenceController } from './controller';
import { rustAdapter } from './languages/rust';
import { goAdapter } from './languages/go';
import { pythonAdapter } from './languages/python';
import { typescriptAdapter } from './languages/typescript';
import { htmlAdapter, cssAdapter } from './languages/web';
import { shellAdapter } from './languages/shell';
import { LiveTerminalContext } from './terminalLive';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    const entries = await Promise.all([rustAdapter, goAdapter, shellAdapter, typescriptAdapter, pythonAdapter, htmlAdapter, cssAdapter].map(async adapter => {
      const raw = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri, 'packs', adapter.languageId + '.json'));
      const reference = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri, 'packs', adapter.languageId + '-reference.json'));
      const pack = validatePack({ ...JSON.parse(Buffer.from(raw).toString('utf8')),
        referenceTopics: JSON.parse(Buffer.from(reference).toString('utf8')) });
      return { pack, adapter };
    }));
    const controller = new ReferenceController(context.extensionUri, entries, context.workspaceState);
    if (context.environmentVariableCollection) {
      const live = new LiveTerminalContext(context.environmentVariableCollection,
        (terminal, cues) => controller.updateTerminalInput(terminal, cues));
      context.subscriptions.push(live);
      try { await live.start(); }
      catch (error) {
        live.dispose();
        void vscode.window.showWarningMessage(`Syntaxiser live Zsh suggestions unavailable: ${String(error)}`);
      }
    }
    context.subscriptions.push(
      controller,
      vscode.window.registerWebviewViewProvider('syntaxiser.reference', controller.sidebar),
      vscode.commands.registerCommand('syntaxiser.open', () => vscode.commands.executeCommand('syntaxiser.reference.focus')),
      vscode.commands.registerCommand('syntaxiser.terminalContext', () => controller.useTerminal(vscode.window.activeTerminal)),
      vscode.commands.registerCommand('syntaxiser.refresh', () => controller.schedule(true)),
    );
  } catch (error) {
    void vscode.window.showErrorMessage(`Syntaxiser could not load its reference pack: ${error instanceof Error ? error.message : String(error)}`);
  }
}
