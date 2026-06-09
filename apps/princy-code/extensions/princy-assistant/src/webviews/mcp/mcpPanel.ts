import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { withClient } from "../../princyClient.js";
import { getWebviewOptions } from "../shared.js";
import { bindWebviewMessages, postToWebview, renderReactWebview } from "../reactHost.js";

export class McpViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "princy.mcpView";

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly auth: AuthService
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = getWebviewOptions(this.extensionUri);
    this.setupWebview(webviewView.webview);
  }

  async openInPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      "princyMcp",
      "Princy MCP Center",
      vscode.ViewColumn.Beside,
      { ...getWebviewOptions(this.extensionUri), retainContextWhenHidden: true }
    );
    this.setupWebview(panel.webview);
  }

  private setupWebview(webview: vscode.Webview): void {
    webview.html = renderReactWebview(webview, this.extensionUri, "mcp");
    bindWebviewMessages(webview, async (msg) => {
      if (msg.type === "ready" || msg.type === "refresh") await this.loadData(webview);
      if (msg.type === "test") {
        const serverId = msg.serverId as string;
        const start = Date.now();
        const result = await withClient(this.auth, (c) => c.mcpTest(serverId));
        postToWebview(webview, {
          type: "testResult",
          serverId,
          ok: result?.ok ?? false,
          latencyMs: result?.latencyMs ?? Date.now() - start
        });
      }
    });
  }

  private async loadData(webview: vscode.Webview): Promise<void> {
    const data = await withClient(this.auth, async (c) => {
      const [servers, health] = await Promise.all([c.mcpServers(), c.mcpHealth()]);
      const list = (servers.servers ?? servers.items ?? []) as Array<{ id: string; name: string; status?: string }>;
      return { servers: list, health, logs: [] as string[] };
    });
    postToWebview(webview, {
      type: "data",
      servers: data?.servers ?? [],
      health: data?.health ?? {},
      logs: data?.logs ?? []
    });
  }
}
