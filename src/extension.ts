import * as vscode from 'vscode';
import { validatePack } from './core/pack';
import { ReferenceController } from './controller';
import { rustAdapter } from './languages/rust';
import { goAdapter } from './languages/go';
import { shellAdapter } from './languages/shell';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    const entries = await Promise.all([rustAdapter, goAdapter, shellAdapter].map(async adapter => {
      const raw = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri, 'packs', adapter.languageId + '.json'));
      const reference = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri, 'packs', adapter.languageId + '-reference.json'));
      const pack = validatePack({ ...JSON.parse(Buffer.from(raw).toString('utf8')),
        referenceTopics: JSON.parse(Buffer.from(reference).toString('utf8')) });
      return { pack, adapter };
    }));
    const controller = new ReferenceController(context.extensionUri, entries, context.workspaceState);
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
