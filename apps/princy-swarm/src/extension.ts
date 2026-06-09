import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("princy-swarm.open", () =>
      vscode.commands.executeCommand("princy.openSwarm")
    )
  );
  vscode.commands.executeCommand("setContext", "princy-swarm.loaded", true);
}

export function deactivate(): void {}
