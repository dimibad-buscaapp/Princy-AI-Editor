import * as vscode from "vscode";
import type { AuthService } from "../auth.js";
import { guardSelection } from "../security/fileGuard.js";
import { withClient } from "../princyClient.js";

const outputChannel = vscode.window.createOutputChannel("Princy");

export function registerInlineChatCommands(context: vscode.ExtensionContext, auth: AuthService): void {
  const runAction = async (
    action: "explain" | "refactor" | "fix" | "tests",
    editor?: vscode.TextEditor
  ) => {
    const ed = editor ?? vscode.window.activeTextEditor;
    const code = await guardSelection(ed);
    if (!code) return;

    const language = ed?.document.languageId;
    const filePath = ed?.document.uri.fsPath ?? "";

    let patchText: string | undefined;

    if (action === "explain") {
      const result = await withClient(auth, (c) => c.codeExplain(code, `File: ${filePath}`));
      if (!result) return;
      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine(`## Explanation\n${result.explanation}`);
    } else if (action === "refactor") {
      const result = await withClient(auth, (c) =>
        c.codeRefactor(code, "Improve code quality", `File: ${filePath}`)
      );
      if (!result) return;
      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine(`## Plan\n${result.plan}\n\n## Refactored\n${result.refactored}`);
      patchText = result.refactored;
    } else if (action === "fix") {
      const result = await withClient(auth, (c) =>
        c.codeFix(code, undefined, { language, context: `File: ${filePath}` })
      );
      if (!result) return;
      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine(`## Fix\n${result.fix}\n\n${result.explanation}`);
      patchText = result.fix;
    } else {
      const result = await withClient(auth, (c) => c.codeTests(code, `File: ${filePath}`));
      if (!result) return;
      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine(`## Tests\n${result.tests}`);
    }

    const apply = await vscode.window.showInformationMessage(
      "Princy result ready in Output panel.",
      "Apply as Patch"
    );
    if (apply === "Apply as Patch" && ed && patchText) {
      await ed.edit((builder) => {
        builder.replace(ed.selection, patchText!);
      });
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("princy.explainSelection", () => runAction("explain")),
    vscode.commands.registerCommand("princy.refactorSelection", () => runAction("refactor")),
    vscode.commands.registerCommand("princy.fixSelection", () => runAction("fix")),
    vscode.commands.registerCommand("princy.generateTests", () => runAction("tests")),
    vscode.commands.registerCommand("princy.askAboutSelection", async () => {
      const items = [
        { label: "Explicar", action: "explain" as const },
        { label: "Refatorar", action: "refactor" as const },
        { label: "Corrigir", action: "fix" as const },
        { label: "Testes", action: "tests" as const }
      ];
      const picked = await vscode.window.showQuickPick(items, { placeHolder: "Princy action" });
      if (picked) await runAction(picked.action);
    }),
    vscode.languages.registerCodeLensProvider(
      { pattern: "**" },
      {
        provideCodeLenses(document) {
          const top = new vscode.Range(0, 0, 0, 0);
          return [
            new vscode.CodeLens(top, { title: "Princy: Explain", command: "princy.explainSelection" }),
            new vscode.CodeLens(top, { title: "Princy: Refactor", command: "princy.refactorSelection" })
          ];
        }
      }
    )
  );
}
