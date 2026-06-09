import * as vscode from "vscode";
import { getNonce, princyStyles } from "./shared.js";

export type UiSettings = {
  chatAnimations: boolean;
  motionEnabled: boolean;
  swarmLiveUpdates: boolean;
  projectId: string;
};

export function getUiSettings(): UiSettings {
  const config = vscode.workspace.getConfiguration("princy");
  return {
    chatAnimations: config.get<boolean>("chatAnimations", true),
    motionEnabled: config.get<boolean>("motionEnabled", true),
    swarmLiveUpdates: config.get<boolean>("swarmLiveUpdates", true),
    projectId: config.get<string>("defaultProjectId", "demo")
  };
}

export function renderReactWebview(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  bundleName: string,
  extraInit: Record<string, unknown> = {}
): string {
  const nonce = getNonce();
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "webviews", `${bundleName}.js`)
  );
  const init = { ...getUiSettings(), ...extraInit };
  const initJson = JSON.stringify(init).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline';" />
  <style>${princyStyles()}</style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">window.__PRINCY_INIT__ = ${initJson};</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

export function bindWebviewMessages(
  webview: vscode.Webview,
  handler: (msg: { type: string; [key: string]: unknown }) => void | Promise<void>
): vscode.Disposable {
  return webview.onDidReceiveMessage((msg) => void handler(msg));
}

export function postToWebview(webview: vscode.Webview, msg: unknown): void {
  void webview.postMessage(msg);
}
