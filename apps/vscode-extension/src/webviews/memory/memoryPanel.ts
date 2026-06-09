import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { withClient } from "../../princyClient.js";
import { checkMemoryWritePermission } from "../../security/fileGuard.js";
import { getWebviewOptions } from "../shared.js";
import { bindWebviewMessages, postToWebview, renderReactWebview, getUiSettings } from "../reactHost.js";

export class MemoryViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "princy.memoryView";

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
      "princyMemory",
      "Princy Memory",
      vscode.ViewColumn.Beside,
      { ...getWebviewOptions(this.extensionUri), retainContextWhenHidden: true }
    );
    this.setupWebview(panel.webview);
  }

  private setupWebview(webview: vscode.Webview): void {
    webview.html = renderReactWebview(webview, this.extensionUri, "memory");
    bindWebviewMessages(webview, async (msg) => {
      if (msg.type === "ready" || msg.type === "refresh" || msg.type === "filterScope") {
        await this.loadData(webview, msg.scope as string | undefined);
      }
      if (msg.type === "search") {
        await this.search(webview, msg.query as string, msg.scope as string | undefined);
      }
      if (msg.type === "create") {
        if (!(await checkMemoryWritePermission(this.auth))) return;
        const { projectId } = getUiSettings();
        await withClient(this.auth, (c) =>
          c.memoryCreate(projectId, msg.content as string, msg.scope as string)
        );
        await this.loadData(webview, msg.scope as string | undefined);
      }
      if (msg.type === "delete") {
        if (!(await checkMemoryWritePermission(this.auth))) return;
        await withClient(this.auth, (c) => c.memoryDelete(msg.id as string));
        await this.loadData(webview);
      }
    });
  }

  private async loadData(webview: vscode.Webview, scope?: string): Promise<void> {
    const { projectId } = getUiSettings();
    const data = await withClient(this.auth, async (c) => {
      const [project, usage] = await Promise.all([
        c.memoryProject(projectId),
        c.memoryUsage()
      ]);
      let chunks = (project.chunks as Array<{ id: string; content: string; scope?: string }>) ?? [];
      if (scope) chunks = chunks.filter((ch) => ch.scope === scope);
      return { chunks, usage };
    });
    postToWebview(webview, { type: "data", chunks: data?.chunks ?? [], usage: data?.usage ?? {} });
  }

  private async search(webview: vscode.Webview, query: string, scope?: string): Promise<void> {
    const { projectId } = getUiSettings();
    const data = await withClient(this.auth, (c) => c.memorySearch(query, projectId, scope));
    postToWebview(webview, {
      type: "data",
      chunks: (data?.chunks as Array<{ id: string; content: string; scope?: string }>) ?? [],
      usage: {}
    });
  }
}
