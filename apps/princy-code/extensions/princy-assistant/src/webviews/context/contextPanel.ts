import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { linkWorkspace, withClient } from "../../princyClient.js";
import { getNonce, getWebviewOptions, princyStyles } from "../shared.js";

export async function openContextGraph(auth: AuthService, extensionUri: vscode.Uri): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    "princyContextGraph",
    "Princy Context Graph",
    vscode.ViewColumn.Beside,
    { ...getWebviewOptions(extensionUri), retainContextWhenHidden: true }
  );
  panel.webview.html = getContextHtml(panel.webview);

  const projectId = await resolveProjectId(auth);
  if (!projectId) {
    panel.webview.postMessage({ type: "error", message: "No workspace linked." });
    return;
  }

  const graph = await withClient(auth, (c) => c.contextGraph(projectId));
  if (graph) {
    panel.webview.postMessage({ type: "graph", graph });
  }
}

export async function indexWorkspace(auth: AuthService): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) {
    vscode.window.showWarningMessage("Open a workspace folder first.");
    return;
  }

  const result = await withClient(auth, (c) =>
    c.workspaceIndex({ localPath: folders[0].uri.fsPath })
  );
  if (!result) return;

  await vscode.workspace.getConfiguration("princy").update(
    "workspaceId",
    result.workspaceId,
    vscode.ConfigurationTarget.Workspace
  );

  vscode.window.showInformationMessage(
    `Indexed ${result.items.length} items for Princy context graph.`
  );
}

async function resolveProjectId(auth: AuthService): Promise<string | undefined> {
  const wsId = await linkWorkspace(auth);
  if (!wsId) return undefined;
  const linked = await withClient(auth, (c) =>
    c.workspaceLink(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "")
  );
  return linked?.workspace.projectId;
}

function getContextHtml(webview: vscode.Webview): string {
  const nonce = getNonce();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <style>${princyStyles()}</style>
</head>
<body>
  <div class="content" id="tree"><div class="node">Loading context graph...</div></div>
  <script nonce="${nonce}">
    window.addEventListener('message', (e) => {
      const tree = document.getElementById('tree');
      if (e.data.type === 'error') { tree.innerHTML = '<div class="node">' + e.data.message + '</div>'; return; }
      if (e.data.type !== 'graph') return;
      const g = e.data.graph;
      tree.innerHTML = '';
      const nodes = g.nodes || [];
      const edges = g.edges || [];
      const header = document.createElement('div');
      header.className = 'node';
      header.textContent = nodes.length + ' nodes, ' + edges.length + ' edges';
      tree.appendChild(header);
      for (const n of nodes.slice(0, 200)) {
        const el = document.createElement('div');
        el.className = 'node';
        el.textContent = (n.label || n.id || n.type || 'node');
        tree.appendChild(el);
      }
    });
  </script>
</body>
</html>`;
}
