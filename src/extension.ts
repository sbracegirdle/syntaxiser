import * as vscode from 'vscode';
import { validatePack } from './core/pack';
import { ReferenceController } from './controller';
import { rustAdapter } from './languages/rust';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    const raw = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri, 'packs', 'rust.json'));
    const pack = validatePack(JSON.parse(Buffer.from(raw).toString('utf8')));
    const controller = new ReferenceController(context.extensionUri, [{ pack, adapter: rustAdapter }], context.workspaceState);
    context.subscriptions.push(
      controller,
      vscode.window.registerWebviewViewProvider('syntaxiser.reference', controller.sidebar),
      vscode.commands.registerCommand('syntaxiser.open', () => vscode.commands.executeCommand('syntaxiser.reference.focus')),
      vscode.commands.registerCommand('syntaxiser.refresh', () => controller.schedule(true)),
    );
  } catch (error) {
    void vscode.window.showErrorMessage(`Syntaxiser could not load its reference pack: ${error instanceof Error ? error.message : String(error)}`);
  }
}
