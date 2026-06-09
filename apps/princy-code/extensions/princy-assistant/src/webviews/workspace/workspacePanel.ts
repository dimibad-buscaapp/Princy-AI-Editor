import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { withClient } from "../../princyClient.js";
import { getWebviewOptions } from "../shared.js";
import { bindWebviewMessages, postToWebview, renderReactWebview } from "../reactHost.js";
import { previewPatchById, applyPatchById, rollbackPatchById } from "../../patch/preview.js";

export class WorkspaceViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "princy.workspaceView";

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
      "princyWorkspace",
      "Princy Workspace",
      vscode.ViewColumn.Beside,
      { ...getWebviewOptions(this.extensionUri), retainContextWhenHidden: true }
    );
    this.setupWebview(panel.webview);
  }

  private setupWebview(webview: vscode.Webview): void {
    webview.html = renderReactWebview(webview, this.extensionUri, "workspace");
    bindWebviewMessages(webview, async (msg) => {
      if (msg.type === "ready" || msg.type === "refresh") await this.loadData(webview);
      if (msg.type === "index") {
        const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (folder) {
          await withClient(this.auth, (c) => c.workspaceIndex({ localPath: folder }));
          await this.loadData(webview);
        }
      }
      if (msg.type === "previewPatch") await previewPatchById(this.auth, msg.patchId as string);
      if (msg.type === "applyPatch") await applyPatchById(this.auth, msg.patchId as string);
      if (msg.type === "rollbackPatch") await rollbackPatchById(this.auth, msg.patchId as string);
    });
  }

  private async loadData(webview: vscode.Webview): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const data = await withClient(this.auth, async (c) => {
      const [profile, detect, patches] = await Promise.all([
        folder ? c.workspaceProfile({ localPath: folder }) : Promise.resolve({ profile: {} }),
        folder ? c.workspaceDetect({ localPath: folder }).catch(() => ({ detect: {} })) : Promise.resolve({ detect: {} }),
        c.patchList().catch(() => ({ patches: [] }))
      ]);
      return { profile: profile.profile, detect: detect.detect, patches: patches.patches };
    });
    postToWebview(webview, {
      type: "data",
      profile: data?.profile ?? {},
      detect: data?.detect ?? {},
      patches: data?.patches ?? []
    });
  }
}
