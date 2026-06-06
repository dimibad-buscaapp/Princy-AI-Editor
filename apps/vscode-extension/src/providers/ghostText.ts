import * as vscode from "vscode";
import type { AuthService } from "../auth.js";
import { getPrincyClient } from "../princyClient.js";

export function registerGhostTextProvider(
  context: vscode.ExtensionContext,
  auth: AuthService
): vscode.Disposable {
  const provider: vscode.InlineCompletionItemProvider = {
    provideInlineCompletionItems: async (document, position, _ctx, token) => {
      const config = vscode.workspace.getConfiguration("princy");
      if (!config.get<boolean>("enableGhostText", true)) return [];
      if (!(await auth.isSignedIn())) return [];

      const debounceMs = config.get<number>("ghostTextDebounceMs", 500);
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, debounceMs);
        token.onCancellationRequested(() => {
          clearTimeout(timer);
          resolve();
        });
      });
      if (token.isCancellationRequested) return [];

      const prefix = document.getText(
        new vscode.Range(
          Math.max(0, position.line - 3),
          0,
          position.line,
          position.character
        )
      );
      if (prefix.trim().length < 8) return [];

      try {
        const client = getPrincyClient(auth);
        const data = await client.ghostText(prefix, document.languageId);
        if (!data.suggestion || token.isCancellationRequested) return [];

        const insertText = data.suggestion.startsWith(prefix)
          ? data.suggestion.slice(prefix.length)
          : data.suggestion;
        if (!insertText) return [];

        const item = new vscode.InlineCompletionItem(
          insertText,
          new vscode.Range(position, position)
        );
        return [item];
      } catch {
        return [];
      }
    }
  };

  const langs = [
    "typescript",
    "javascript",
    "typescriptreact",
    "javascriptreact",
    "python",
    "go",
    "rust",
    "java",
    "csharp",
    "json",
    "yaml",
    "markdown"
  ];

  const disposables = langs.map((lang) =>
    vscode.languages.registerInlineCompletionItemProvider({ language: lang, pattern: "**" }, provider)
  );

  return vscode.Disposable.from(...disposables);
}
