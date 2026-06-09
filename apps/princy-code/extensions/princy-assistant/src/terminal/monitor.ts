import * as vscode from "vscode";
import type { AuthService } from "../auth.js";
import { withClient } from "../princyClient.js";

let lastTerminalOutput = "";

const outputChannel = vscode.window.createOutputChannel("Princy Terminal");
const structuredChannel = vscode.window.createOutputChannel("Princy Terminal (Structured)");

type LogLevel = "error" | "warn" | "info";

function parseLogLines(text: string): Array<{ level: LogLevel; line: string }> {
  return text.split("\n").filter(Boolean).map((line) => {
    if (/error|ERR_|failed|exception/i.test(line)) return { level: "error" as const, line };
    if (/warn|warning/i.test(line)) return { level: "warn" as const, line };
    return { level: "info" as const, line };
  });
}

function badge(level: LogLevel): string {
  if (level === "error") return "[ERROR]";
  if (level === "warn") return "[WARN]";
  return "[INFO]";
}

export function registerTerminalCommands(context: vscode.ExtensionContext, auth: AuthService): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("princy.explainTerminalError", async () => {
      const output = await getTerminalOutput();
      if (!output) return;
      emitStructured(output);
      const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const result = await withClient(auth, (c) => c.terminalExplainError(output, { cwd }));
      if (!result) return;
      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine("## Terminal Error Explanation\n");
      outputChannel.appendLine(result.explanation);
    }),

    vscode.commands.registerCommand("princy.fixTerminalError", async () => {
      const output = await getTerminalOutput();
      if (!output) return;
      emitStructured(output);
      const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const result = await withClient(auth, (c) => c.terminalFixError(output, { cwd }));
      if (!result) return;
      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine("## Suggested Fix\n");
      outputChannel.appendLine(result.explanation);
      outputChannel.appendLine("\n## Details\n");
      outputChannel.appendLine(result.fix);
      if (result.suggestedCommand) {
        const run = await vscode.window.showInformationMessage(
          `Suggested: ${result.suggestedCommand}`,
          "Copy",
          "Retry Fix"
        );
        if (run === "Copy") await vscode.env.clipboard.writeText(result.suggestedCommand);
        if (run === "Retry Fix") await vscode.commands.executeCommand("princy.fixTerminalError");
      }
    }),

    vscode.commands.registerCommand("princy.generateTerminalCommand", async () => {
      const objective = await vscode.window.showInputBox({ prompt: "What should the terminal command do?" });
      if (!objective) return;
      const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const context = lastTerminalOutput.slice(-2000);
      const result = await withClient(auth, (c) => c.terminalGenerateCommand(objective, context));
      if (!result?.command) return;
      const confirm = await vscode.window.showInformationMessage(
        `Generate: ${result.command}`,
        "Copy",
        "Cancel"
      );
      if (confirm === "Copy") await vscode.env.clipboard.writeText(result.command);
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

function emitStructured(text: string): void {
  structuredChannel.clear();
  structuredChannel.show(true);
  for (const entry of parseLogLines(text)) {
    structuredChannel.appendLine(`${badge(entry.level)} ${entry.line}`);
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
