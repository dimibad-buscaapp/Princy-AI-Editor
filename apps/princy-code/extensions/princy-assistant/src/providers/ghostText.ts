import * as vscode from "vscode";
import type { AuthService } from "../auth.js";
import { getPrincyClient } from "../princyClient.js";

let statusBarItem: vscode.StatusBarItem | undefined;
let lastModel = "Neural Router";
let lastLatencyMs = 0;

export function registerGhostTextProvider(
  context: vscode.ExtensionContext,
  auth: AuthService
): vscode.Disposable {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
  statusBarItem.command = "princy.openChat";
  context.subscriptions.push(statusBarItem);

  let activeEditorCancel: vscode.CancellationTokenSource | undefined;

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(() => {
      activeEditorCancel?.cancel();
      activeEditorCancel = undefined;
    })
  );

  const provider: vscode.InlineCompletionItemProvider = {
    provideInlineCompletionItems: async (document, position, _ctx, token) => {
      const config = vscode.workspace.getConfiguration("princy");
      if (!config.get<boolean>("enableGhostText", true)) return [];
      if (!(await auth.isSignedIn())) return [];

      const debounceMs = config.get<number>("ghostTextDebounceMs", 200);
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, debounceMs);
        token.onCancellationRequested(() => {
          clearTimeout(timer);
          resolve();
        });
      });
      if (token.isCancellationRequested) return [];

      const startLine = Math.max(0, position.line - 5);
      const prefix = document.getText(
        new vscode.Range(startLine, 0, position.line, position.character)
      );
      if (prefix.trim().length < 8) return [];

      const startMs = Date.now();
      try {
        const client = getPrincyClient(auth);
        const data = await client.ghostText(prefix, document.languageId);
        if (!data.suggestion || token.isCancellationRequested) return [];

        lastModel = data.model ?? "qwen2.5:3b";
        lastLatencyMs = Date.now() - startMs;
        if (statusBarItem) {
          statusBarItem.text = `$(sparkle) ${lastModel} · ${lastLatencyMs}ms`;
          statusBarItem.show();
        }

        const insertText = data.suggestion.startsWith(prefix)
          ? data.suggestion.slice(prefix.length)
          : data.suggestion;
        if (!insertText) return [];

        return [new vscode.InlineCompletionItem(insertText, new vscode.Range(position, position))];
      } catch {
        return [];
      }
    }
  };

  const langs = [
    "typescript", "javascript", "typescriptreact", "javascriptreact",
    "python", "go", "rust", "java", "csharp", "json", "yaml", "markdown"
  ];

  const disposables = langs.map((lang) =>
    vscode.languages.registerInlineCompletionItemProvider({ language: lang, pattern: "**" }, provider)
  );

  return vscode.Disposable.from(...disposables);
}

export function getLastGhostMetrics(): { model: string; latencyMs: number } {
  return { model: lastModel, latencyMs: lastLatencyMs };
}
