import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { withClient } from "../../princyClient.js";
import { getNonce, getWebviewOptions, princyStyles } from "../shared.js";

export async function startAutonomousMode(auth: AuthService, extensionUri: vscode.Uri): Promise<void> {
  const enabled = vscode.workspace.getConfiguration("princy").get<boolean>("enableAutonomousMode", false);
  if (!enabled) {
    const enable = await vscode.window.showWarningMessage(
      "Autonomous mode is disabled. Enable princy.enableAutonomousMode in settings?",
      "Enable",
      "Cancel"
    );
    if (enable !== "Enable") return;
    await vscode.workspace.getConfiguration("princy").update("enableAutonomousMode", true, true);
  }

  const objective = await vscode.window.showInputBox({
    prompt: "Autonomous objective",
    placeHolder: "Describe what Princy should accomplish..."
  });
  if (!objective) return;

  const panel = vscode.window.createWebviewPanel(
    "princyAutonomous",
    "Princy Autonomous",
    vscode.ViewColumn.Beside,
    { ...getWebviewOptions(extensionUri), retainContextWhenHidden: true }
  );
  panel.webview.html = getAutonomousHtml(panel.webview);
  panel.webview.postMessage({ type: "status", content: "Running autonomous plan..." });

  const result = await withClient(auth, (c) => c.autonomousRun(objective));
  if (!result) {
    panel.webview.postMessage({ type: "error", content: "Autonomous run failed." });
    return;
  }

  const output = JSON.stringify(result, null, 2);
  panel.webview.postMessage({ type: "plan", content: output });

  const approve = await vscode.window.showWarningMessage(
    "Review autonomous plan. Apply patches?",
    { modal: true },
    "Aplicar",
    "Cancelar"
  );
  if (approve === "Aplicar") {
    vscode.window.showInformationMessage("Apply patches via Princy: Preview/Apply Patch with returned patch IDs.");
  }
}

function getAutonomousHtml(webview: vscode.Webview): string {
  const nonce = getNonce();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <style>${princyStyles()}</style>
</head>
<body>
  <div class="content" id="content"><div class="msg system">Waiting...</div></div>
  <script nonce="${nonce}">
    const content = document.getElementById('content');
    window.addEventListener('message', (e) => {
      if (e.data.type === 'status') content.innerHTML = '<div class="msg system">' + e.data.content + '</div>';
      if (e.data.type === 'plan') content.innerHTML = '<div class="msg assistant">' + e.data.content + '</div>';
      if (e.data.type === 'error') content.innerHTML = '<div class="msg system">Error: ' + e.data.content + '</div>';
    });
  </script>
</body>
</html>`;
}
