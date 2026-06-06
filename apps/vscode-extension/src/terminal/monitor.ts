import * as vscode from "vscode";
import type { AuthService } from "../auth.js";
import { withClient } from "../princyClient.js";

let lastTerminalOutput = "";

const outputChannel = vscode.window.createOutputChannel("Princy Terminal");

export function registerTerminalCommands(context: vscode.ExtensionContext, auth: AuthService): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("princy.explainTerminalError", async () => {
      const output = await getTerminalOutput();
      if (!output) return;

      const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const result = await withClient(auth, (c) =>
        c.terminalExplainError(output, { cwd })
      );
      if (!result) return;

      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine("## Terminal Error Explanation\n");
      outputChannel.appendLine(result.explanation);
    }),

    vscode.commands.registerCommand("princy.fixTerminalError", async () => {
      const output = await getTerminalOutput();
      if (!output) return;

      const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const result = await withClient(auth, (c) =>
        c.terminalFixError(output, { cwd })
      );
      if (!result) return;

      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine("## Suggested Fix\n");
      outputChannel.appendLine(result.explanation);
      outputChannel.appendLine("\n## Details\n");
      outputChannel.appendLine(result.fix);
      if (result.suggestedCommand) {
        outputChannel.appendLine(`\nSuggested command (not auto-executed): ${result.suggestedCommand}`);
        const copy = await vscode.window.showInformationMessage(
          "Princy suggested a terminal command.",
          "Copy Command"
        );
        if (copy === "Copy Command") {
          await vscode.env.clipboard.writeText(result.suggestedCommand);
        }
      }
    })
  );

  if ("onDidWriteTerminalData" in vscode.window) {
    const hook = (vscode.window as unknown as {
      onDidWriteTerminalData: (cb: (e: { data: string }) => void) => vscode.Disposable;
    }).onDidWriteTerminalData((e) => {
      lastTerminalOutput += e.data;
      if (lastTerminalOutput.length > 50_000) {
        lastTerminalOutput = lastTerminalOutput.slice(-25_000);
      }
    });
    context.subscriptions.push(hook);
  }
}

async function getTerminalOutput(): Promise<string | undefined> {
  if (lastTerminalOutput.trim()) {
    const lines = lastTerminalOutput.split("\n").filter((l) => /error|Error|ERR_/i.test(l));
    if (lines.length) return lines.slice(-20).join("\n");
    return lastTerminalOutput.slice(-4000);
  }

  const manual = await vscode.window.showInputBox({
    prompt: "Paste terminal error output",
    placeHolder: "error output..."
  });
  return manual ?? undefined;
}
