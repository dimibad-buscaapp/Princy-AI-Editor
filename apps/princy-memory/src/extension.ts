import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("princy-memory.open", () =>
      vscode.commands.executeCommand("princy.openMemory")
    )
  );
}

export function deactivate(): void {}
