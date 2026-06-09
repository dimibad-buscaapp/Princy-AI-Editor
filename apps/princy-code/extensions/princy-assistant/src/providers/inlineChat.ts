import * as vscode from "vscode";
import type { AuthService } from "../auth.js";
import { guardSelection } from "../security/fileGuard.js";
import { withClient } from "../princyClient.js";
import { getWebviewOptions } from "../webviews/shared.js";

const outputChannel = vscode.window.createOutputChannel("Princy");
let inlinePanel: vscode.WebviewPanel | undefined;

const PRESETS = [
  { id: "refactor", label: "Refactor" },
  { id: "explain", label: "Explain" },
  { id: "optimize", label: "Optimize" },
  { id: "document", label: "Document" },
  { id: "tests", label: "Tests" },
  { id: "fix", label: "Fix" }
] as const;

export function registerInlineChatCommands(context: vscode.ExtensionContext, auth: AuthService): void {
  const extensionUri = context.extensionUri;

  const runAction = async (
    action: string,
    editor?: vscode.TextEditor
  ) => {
    const ed = editor ?? vscode.window.activeTextEditor;
    const code = await guardSelection(ed);
    if (!code) return;
    const language = ed?.document.languageId;
    const filePath = ed?.document.uri.fsPath ?? "";
    let patchText: string | undefined;

    if (action === "explain" || action === "document") {
      const result = await withClient(auth, (c) => c.codeExplain(code, `File: ${filePath}`));
      if (!result) return;
      showOutput(`## ${action}\n${result.explanation}`);
    } else if (action === "refactor" || action === "optimize") {
      const result = await withClient(auth, (c) =>
        c.codeRefactor(code, action === "optimize" ? "Optimize performance" : "Improve code quality", `File: ${filePath}`)
      );
      if (!result) return;
      showOutput(`## Plan\n${result.plan}\n\n## Result\n${result.refactored}`);
      patchText = result.refactored;
    } else if (action === "fix" || action === "security" || action === "performance") {
      const objective = action === "security" ? "Security review" : action === "performance" ? "Performance review" : "Fix issues";
      const result = await withClient(auth, (c) =>
        c.codeFix(code, objective, { language, context: `File: ${filePath}` })
      );
      if (!result) return;
      showOutput(`## ${objective}\n${result.fix}\n\n${result.explanation}`);
      patchText = result.fix;
    } else if (action === "tests") {
      const result = await withClient(auth, (c) => c.codeTests(code, `File: ${filePath}`));
      if (!result) return;
      showOutput(`## Tests\n${result.tests}`);
    } else if (action === "api" || action === "migration") {
      const result = await withClient(auth, (c) =>
        c.codeComplete(`${action} for selected code`, { prefix: code, context: filePath, language })
      );
      if (!result) return;
      showOutput(`## ${action}\n${result.suggestion}`);
      patchText = result.suggestion;
    }

    if (patchText && ed) {
      const apply = await vscode.window.showInformationMessage("Apply result to selection?", "Apply", "Dismiss");
      if (apply === "Apply") {
        await ed.edit((b) => b.replace(ed.selection, patchText!));
      }
    }
  };

  const openInlineWidget = async () => {
    const ed = vscode.window.activeTextEditor;
    if (!ed || ed.selection.isEmpty) {
      vscode.window.showWarningMessage("Select code for inline chat.");
      return;
    }
    if (inlinePanel) {
      inlinePanel.reveal();
      return;
    }
    inlinePanel = vscode.window.createWebviewPanel(
      "princyInline",
      "Princy Inline",
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { ...getWebviewOptions(extensionUri), retainContextWhenHidden: true }
    );
    inlinePanel.webview.html = `<!DOCTYPE html><html><head><style>
      body{font-family:system-ui;background:#0a0518;color:#e8f4ff;padding:12px}
      button{margin:4px;padding:8px 12px;border-radius:6px;border:1px solid rgba(0,242,255,.3);background:rgba(98,42,243,.3);color:#00f2ff;cursor:pointer}
    </style></head><body>
      <h3>Inline AI</h3>
      <div id="actions"></div>
      <script>
        const vscode = acquireVsCodeApi();
        const presets = ${JSON.stringify(PRESETS)};
        const el = document.getElementById('actions');
        presets.forEach(p => {
          const b = document.createElement('button');
          b.textContent = p.label;
          b.onclick = () => vscode.postMessage({ type: 'action', action: p.id });
          el.appendChild(b);
        });
      </script></body></html>`;
    inlinePanel.webview.onDidReceiveMessage((msg) => {
      if (msg.type === "action") void runAction(msg.action);
    });
    inlinePanel.onDidDispose(() => { inlinePanel = undefined; });
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("princy.explainSelection", () => runAction("explain")),
    vscode.commands.registerCommand("princy.refactorSelection", () => runAction("refactor")),
    vscode.commands.registerCommand("princy.fixSelection", () => runAction("fix")),
    vscode.commands.registerCommand("princy.generateTests", () => runAction("tests")),
    vscode.commands.registerCommand("princy.documentSelection", () => runAction("document")),
    vscode.commands.registerCommand("princy.optimizeSelection", () => runAction("optimize")),
    vscode.commands.registerCommand("princy.securityReview", () => runAction("security")),
    vscode.commands.registerCommand("princy.performanceReview", () => runAction("performance")),
    vscode.commands.registerCommand("princy.quickChatSelection", () => openInlineWidget()),
    vscode.commands.registerCommand("princy.askAboutSelection", openInlineWidget),
    vscode.commands.registerCommand("princy.sendToSwarm", async () => {
      const code = await guardSelection(vscode.window.activeTextEditor);
      if (!code) return;
      await vscode.commands.executeCommand("princy.openSwarm");
      vscode.window.showInformationMessage("Selection ready — create a swarm task with the objective.");
    }),
    vscode.commands.registerCommand("princy.openInChat", async () => {
      const code = await guardSelection(vscode.window.activeTextEditor);
      if (!code) return;
      await vscode.commands.executeCommand("princy.openChat");
    }),
    vscode.languages.registerCodeLensProvider({ pattern: "**" }, {
      provideCodeLenses(document) {
        const top = new vscode.Range(0, 0, 0, 0);
        return [
          new vscode.CodeLens(top, { title: "Princy: Explain", command: "princy.explainSelection" }),
          new vscode.CodeLens(top, { title: "Princy: Refactor", command: "princy.refactorSelection" }),
          new vscode.CodeLens(top, { title: "Princy: Tests", command: "princy.generateTests" }),
          new vscode.CodeLens(top, { title: "Princy: Fix", command: "princy.fixSelection" }),
          new vscode.CodeLens(top, { title: "Princy: Document", command: "princy.documentSelection" }),
          new vscode.CodeLens(top, { title: "Princy: Optimize", command: "princy.optimizeSelection" }),
          new vscode.CodeLens(top, { title: "Princy: Security", command: "princy.securityReview" }),
          new vscode.CodeLens(top, { title: "Princy: Performance", command: "princy.performanceReview" }),
          new vscode.CodeLens(top, { title: "Princy: Open in Chat", command: "princy.openInChat" }),
          new vscode.CodeLens(top, { title: "Princy: Send to Swarm", command: "princy.sendToSwarm" })
        ];
      }
    })
  );
}

function showOutput(text: string): void {
  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine(text);
}
