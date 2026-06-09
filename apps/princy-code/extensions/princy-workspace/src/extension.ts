import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("princy-workspace.open", () =>
      vscode.commands.executeCommand("princy.openWorkspace")
    )
  );
}

export function deactivate(): void {}
