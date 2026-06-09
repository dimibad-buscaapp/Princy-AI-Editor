import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { withClient } from "../../princyClient.js";
import { SwarmStreamService } from "../swarm/swarmStream.js";
import { getWebviewOptions } from "../shared.js";
import { bindWebviewMessages, postToWebview, renderReactWebview } from "../reactHost.js";

export class AgentHudViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "princy.agentHudView";
  private stream?: SwarmStreamService;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly auth: AuthService
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = getWebviewOptions(this.extensionUri);
    this.setupWebview(webviewView.webview);
    webviewView.onDidDispose(() => this.stream?.stop());
  }

  private setupWebview(webview: vscode.Webview): void {
    webview.html = renderReactWebview(webview, this.extensionUri, "hud");
    this.stream?.stop();
    this.stream = new SwarmStreamService(this.auth);
    bindWebviewMessages(webview, (msg) => {
      if (msg.type === "ready") {
        this.stream?.start({
          onAgents: (agents) => postToWebview(webview, { type: "data", agents, thinking: {} }),
          onActivity: () => {},
          onThinking: (thinking) => postToWebview(webview, { type: "data", agents: [], thinking })
        });
      }
    });
  }
}

export async function openSettingsPanel(auth: AuthService, extensionUri: vscode.Uri): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    "princySettings",
    "Princy Settings",
    vscode.ViewColumn.One,
    { ...getWebviewOptions(extensionUri), retainContextWhenHidden: true }
  );
  panel.webview.html = renderReactWebview(panel.webview, extensionUri, "settings");
  const config = vscode.workspace.getConfiguration("princy");
  const settings: Record<string, unknown> = {};
  for (const key of [
    "endpoint", "frontendUrl", "agentsUrl", "workspaceUrl", "contextUrl", "memoryUrl",
    "automationUrl", "schedulerUrl", "mcpUrl", "defaultProjectId", "model",
    "enableGhostText", "ghostTextDebounceMs", "chatAnimations", "motionEnabled",
    "swarmLiveUpdates", "enableAutonomousMode"
  ]) {
    settings[key] = config.get(key);
  }
  bindWebviewMessages(panel.webview, async (msg) => {
    if (msg.type === "ready") postToWebview(panel.webview, { type: "settings", settings });
    if (msg.type === "update") {
      await config.update(msg.key as string, msg.value, vscode.ConfigurationTarget.Global);
    }
    if (msg.type === "export") {
      const json = JSON.stringify(settings, null, 2);
      await vscode.env.clipboard.writeText(json);
      vscode.window.showInformationMessage("Settings copied to clipboard.");
    }
    if (msg.type === "import") {
      try {
        const imported = JSON.parse(msg.json as string) as Record<string, unknown>;
        for (const [k, v] of Object.entries(imported)) {
          await config.update(k, v, vscode.ConfigurationTarget.Global);
        }
        vscode.window.showInformationMessage("Settings imported.");
      } catch {
        vscode.window.showErrorMessage("Invalid settings JSON.");
      }
    }
  });
}

export async function openStartupHub(auth: AuthService, extensionUri: vscode.Uri, globalState: vscode.Memento): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    "princyStartup",
    "Princy Code",
    vscode.ViewColumn.One,
    { ...getWebviewOptions(extensionUri), retainContextWhenHidden: true }
  );
  panel.webview.html = renderReactWebview(panel.webview, extensionUri, "startup");
  bindWebviewMessages(panel.webview, async (msg) => {
    if (msg.type === "ready") {
      const health = await withClient(auth, (c) => c.systemHealth());
      const recent = globalState.get<Array<{ path: string; lastOpened: string }>>("princy.recentProjects") ?? [];
      const swarmRuns = await withClient(auth, (c) => c.swarmTasks().catch(() => ({ tasks: [] })));
      postToWebview(panel.webview, {
        type: "data",
        health: health ?? {},
        recent,
        swarmRuns: ((swarmRuns?.tasks as Array<{ id: string; title?: string; status?: string }>) ?? []).map((t) => ({
          id: t.id,
          title: t.title ?? t.id,
          status: t.status ?? "unknown"
        }))
      });
    }
    if (msg.type === "openChat") await vscode.commands.executeCommand("princy.openChat");
    if (msg.type === "openSwarm") await vscode.commands.executeCommand("princy.openSwarm");
    if (msg.type === "openMarketplace") await vscode.commands.executeCommand("princy.openMarketplace");
    if (msg.type === "openProject") {
      const uri = vscode.Uri.file(msg.path as string);
      await vscode.commands.executeCommand("vscode.openFolder", uri);
    }
  });
}

export async function openPatchPanel(auth: AuthService, extensionUri: vscode.Uri): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    "princyPatch",
    "Princy Patches",
    vscode.ViewColumn.Beside,
    { ...getWebviewOptions(extensionUri), retainContextWhenHidden: true }
  );
  panel.webview.html = renderReactWebview(panel.webview, extensionUri, "patch");
  bindWebviewMessages(panel.webview, async (msg) => {
    if (msg.type === "ready" || msg.type === "refresh") {
      const data = await withClient(auth, (c) => c.patchList());
      postToWebview(panel.webview, { type: "data", patches: data?.patches ?? [] });
    }
    if (msg.type === "preview") await vscode.commands.executeCommand("princy.previewPatch");
    if (msg.type === "apply") {
      postToWebview(panel.webview, { type: "applying", patchId: msg.patchId });
      await withClient(auth, (c) => c.patchApply(msg.patchId as string));
      postToWebview(panel.webview, { type: "applied" });
    }
    if (msg.type === "reject") await withClient(auth, (c) => c.patchReject(msg.patchId as string));
    if (msg.type === "rollback") await withClient(auth, (c) => c.patchRollback(msg.patchId as string));
  });
}
