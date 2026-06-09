import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { withClient } from "../../princyClient.js";
import { getWebviewOptions } from "../shared.js";
import { bindWebviewMessages, postToWebview, renderReactWebview } from "../reactHost.js";
import { SwarmStreamService } from "./swarmStream.js";

export class SwarmViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "princy.swarmView";
  private view?: vscode.WebviewView;
  private stream?: SwarmStreamService;
  private lastTaskId?: string;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly auth: AuthService
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = getWebviewOptions(this.extensionUri);
    this.setupWebview(webviewView.webview);
    webviewView.onDidDispose(() => this.stream?.stop());
  }

  async openInPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      "princySwarm",
      "Princy Swarm",
      vscode.ViewColumn.Beside,
      { ...getWebviewOptions(this.extensionUri), retainContextWhenHidden: true }
    );
    this.setupWebview(panel.webview);
    panel.onDidDispose(() => this.stream?.stop());
  }

  private setupWebview(webview: vscode.Webview): void {
    webview.html = renderReactWebview(webview, this.extensionUri, "swarm");
    this.stream?.stop();
    this.stream = new SwarmStreamService(this.auth);

    bindWebviewMessages(webview, async (msg) => {
      if (msg.type === "ready" || msg.type === "refresh") {
        postToWebview(webview, { type: "loading" });
        this.stream?.start({
          onAgents: (agents) => postToWebview(webview, { type: "data", agents, activity: [], thinking: {} }),
          onActivity: (entry) =>
            postToWebview(webview, {
              type: "data",
              agents: [],
              activity: [entry],
              thinking: {}
            }),
          onThinking: (thinking) =>
            postToWebview(webview, { type: "data", agents: [], activity: [], thinking })
        });
      }
      if (msg.type === "createTask") {
        const objective = msg.objective as string;
        const result = await withClient(this.auth, (c) =>
          c.swarmCreateTask("Swarm Task", objective)
        );
        if (result?.pipelineId) {
          this.lastTaskId = result.pipelineId;
          vscode.window.showInformationMessage(`Swarm task created: ${result.pipelineId}`);
        }
      }
      if (msg.type === "runTask" && this.lastTaskId) {
        await withClient(this.auth, (c) => c.swarmRunTask(this.lastTaskId!));
      }
    });
  }
}
