import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { withClient } from "../../princyClient.js";
import { getWebviewOptions } from "../shared.js";
import { bindWebviewMessages, postToWebview, renderReactWebview } from "../reactHost.js";

export class ObservabilityViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "princy.observabilityView";
  private pollTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly auth: AuthService
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = getWebviewOptions(this.extensionUri);
    this.setupWebview(webviewView.webview);
    webviewView.onDidDispose(() => {
      if (this.pollTimer) clearInterval(this.pollTimer);
    });
  }

  async openInPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      "princyObservability",
      "Princy Observability",
      vscode.ViewColumn.Beside,
      { ...getWebviewOptions(this.extensionUri), retainContextWhenHidden: true }
    );
    this.setupWebview(panel.webview);
  }

  private setupWebview(webview: vscode.Webview): void {
    webview.html = renderReactWebview(webview, this.extensionUri, "observability");
    bindWebviewMessages(webview, async (msg) => {
      if (msg.type === "ready") {
        await this.refresh(webview);
        this.pollTimer = setInterval(() => void this.refresh(webview), 15_000);
      }
    });
  }

  private async refresh(webview: vscode.Webview): Promise<void> {
    const data = await withClient(this.auth, async (c) => {
      const [health, router, metrics] = await Promise.all([
        c.systemHealth(),
        c.routerStats(),
        c.fetchObservabilityMetrics().catch(() => ({}))
      ]);
      return { health, router, metrics };
    });
    postToWebview(webview, {
      type: "data",
      health: data?.health ?? {},
      router: data?.router ?? {},
      metrics: data?.metrics ?? {}
    });
  }
}
