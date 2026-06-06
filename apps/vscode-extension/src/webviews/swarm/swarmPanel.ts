import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { withClient } from "../../princyClient.js";
import { getNonce, getWebviewOptions, princyStyles } from "../shared.js";

const SWARM_DISPLAY_NAMES: Record<string, string> = {
  ARCHITECT: "ARQUITETO",
  REVIEWER: "ANALISTA",
  DEVELOPER: "DESENVOLVEDOR",
  RESEARCHER: "PESQUISADOR",
  TESTER: "TESTADOR",
  WRITER: "ESCRITOR",
  DEVOPS: "DEVOPS",
  COORDINATOR: "COORDENADOR",
  MEMORY: "MEMORY ENGINE",
  CONTEXT_GRAPH: "AUTONOMOUS ENGINE"
};

export class SwarmViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "princy.swarmView";
  private view?: vscode.WebviewView;
  private pollTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly auth: AuthService
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = getWebviewOptions(this.extensionUri);
    webviewView.webview.html = this.getHtml(webviewView.webview);
    void this.refresh(webviewView.webview);
    this.pollTimer = setInterval(() => void this.refresh(webviewView.webview), 10_000);
    webviewView.onDidDispose(() => {
      if (this.pollTimer) clearInterval(this.pollTimer);
    });
  }

  async openInPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      "princySwarm",
      "Princy Swarm",
      vscode.ViewColumn.Beside,
      { ...getWebviewOptions(this.extensionUri), retainContextWhenHidden: true }
    );
    panel.webview.html = this.getHtml(panel.webview);
    void this.refresh(panel.webview);
    const timer = setInterval(() => void this.refresh(panel.webview), 10_000);
    panel.onDidDispose(() => clearInterval(timer));
  }

  private async refresh(webview: vscode.Webview) {
    const data = await withClient(this.auth, async (client) => {
      const [status, metrics] = await Promise.all([
        client.agentsStatus(),
        client.agentsMetrics()
      ]);
      return { status, metrics };
    });
    if (!data) return;

    const agents = (data.status.agents as Array<{ type?: string; role?: string; status?: string; tasks?: number }>) ?? [];
    const mapped = agents.map((a) => ({
      name: SWARM_DISPLAY_NAMES[a.type ?? a.role ?? ""] ?? (a.type ?? a.role ?? "AGENT"),
      status: a.status ?? "idle",
      tasks: a.tasks ?? 0
    }));

    webview.postMessage({ type: "update", agents: mapped, metrics: data.metrics });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <style>${princyStyles()}
    h2 { color: var(--violet); font-size: 14px; margin: 0 0 12px; }
  </style>
</head>
<body>
  <div class="content" id="content">
    <h2>Swarm Status</h2>
    <div id="agents"></div>
    <h2 style="margin-top:16px">Metrics</h2>
    <pre id="metrics" style="color:var(--muted);font-size:12px;white-space:pre-wrap;"></pre>
  </div>
  <script nonce="${nonce}">
    window.addEventListener('message', (e) => {
      if (e.data.type !== 'update') return;
      const agentsEl = document.getElementById('agents');
      agentsEl.innerHTML = '';
      for (const a of e.data.agents) {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.innerHTML = '<strong>' + a.name + '</strong><div class="status">' + a.status + ' · tasks: ' + a.tasks + '</div>';
        agentsEl.appendChild(card);
      }
      document.getElementById('metrics').textContent = JSON.stringify(e.data.metrics, null, 2);
    });
  </script>
</body>
</html>`;
  }
}
