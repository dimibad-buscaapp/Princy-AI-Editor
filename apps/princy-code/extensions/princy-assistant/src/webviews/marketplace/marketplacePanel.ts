import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { withClient } from "../../princyClient.js";
import { getWebviewOptions } from "../shared.js";
import { bindWebviewMessages, postToWebview, renderReactWebview } from "../reactHost.js";

export class MarketplaceViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "princy.marketplaceView";
  private currentTab = "agents";

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
      "princyMarketplace",
      "Princy Marketplace",
      vscode.ViewColumn.Beside,
      { ...getWebviewOptions(this.extensionUri), retainContextWhenHidden: true }
    );
    this.setupWebview(panel.webview);
  }

  private setupWebview(webview: vscode.Webview): void {
    webview.html = renderReactWebview(webview, this.extensionUri, "marketplace");
    bindWebviewMessages(webview, async (msg) => {
      if (msg.type === "ready" || msg.type === "loadTab") {
        if (msg.tab) this.currentTab = msg.tab as string;
        await this.loadTab(webview, this.currentTab);
      }
      if (msg.type === "action") {
        await withClient(this.auth, (c) =>
          c.marketplaceAction(msg.tab as string, msg.id as string, msg.action as "install" | "uninstall")
        );
        await this.loadTab(webview, msg.tab as string);
      }
    });
  }

  private async loadTab(webview: vscode.Webview, tab: string): Promise<void> {
    try {
      const data = await withClient(this.auth, (c) => c.marketplaceItems(tab));
      postToWebview(webview, {
        type: "data",
        items: (data?.items as Array<{ id: string; name: string; description?: string }>) ?? []
      });
    } catch (err) {
      postToWebview(webview, {
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load marketplace"
      });
    }
  }
}
