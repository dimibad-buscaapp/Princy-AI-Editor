import * as vscode from "vscode";
import { AuthService } from "./auth.js";
import { validatePrincySettings, showValidationErrors } from "./config/validate-urls.js";
import { runStartupHealthCheck } from "./config/health-probe.js";
import { getPrincyClient, linkWorkspace, resetPrincyClient } from "./princyClient.js";
import { registerGhostTextProvider } from "./providers/ghostText.js";
import { registerInlineChatCommands } from "./providers/inlineChat.js";
import { registerPatchDecorations } from "./providers/patchDecorations.js";
import { registerPatchCommands } from "./patch/preview.js";
import { registerTerminalCommands } from "./terminal/monitor.js";
import { ChatViewProvider } from "./webviews/chat/chatPanel.js";
import { SwarmViewProvider } from "./webviews/swarm/swarmPanel.js";
import { MemoryViewProvider } from "./webviews/memory/memoryPanel.js";
import { MarketplaceViewProvider } from "./webviews/marketplace/marketplacePanel.js";
import { McpViewProvider } from "./webviews/mcp/mcpPanel.js";
import { ObservabilityViewProvider } from "./webviews/observability/observabilityPanel.js";
import { WorkspaceViewProvider } from "./webviews/workspace/workspacePanel.js";
import { indexWorkspace, openContextGraph } from "./webviews/context/contextPanel.js";
import { startAutonomousMode } from "./webviews/autonomous/autonomousPanel.js";
import {
  AgentHudViewProvider,
  openSettingsPanel,
  openStartupHub,
  openPatchPanel
} from "./webviews/hud/agentHudPanel.js";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const validationErrors = validatePrincySettings();
  if (validationErrors.length > 0) {
    await showValidationErrors(validationErrors);
  }

  const auth = new AuthService(context.secrets);
  void runStartupHealthCheck(auth);

  const chatProvider = new ChatViewProvider(context.extensionUri, auth);
  const swarmProvider = new SwarmViewProvider(context.extensionUri, auth);
  const memoryProvider = new MemoryViewProvider(context.extensionUri, auth);
  const marketplaceProvider = new MarketplaceViewProvider(context.extensionUri, auth);
  const mcpProvider = new McpViewProvider(context.extensionUri, auth);
  const observabilityProvider = new ObservabilityViewProvider(context.extensionUri, auth);
  const workspaceProvider = new WorkspaceViewProvider(context.extensionUri, auth);
  const hudProvider = new AgentHudViewProvider(context.extensionUri, auth);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatProvider),
    vscode.window.registerWebviewViewProvider(SwarmViewProvider.viewType, swarmProvider),
    vscode.window.registerWebviewViewProvider(MemoryViewProvider.viewType, memoryProvider),
    vscode.window.registerWebviewViewProvider(MarketplaceViewProvider.viewType, marketplaceProvider),
    vscode.window.registerWebviewViewProvider(McpViewProvider.viewType, mcpProvider),
    vscode.window.registerWebviewViewProvider(ObservabilityViewProvider.viewType, observabilityProvider),
    vscode.window.registerWebviewViewProvider(WorkspaceViewProvider.viewType, workspaceProvider),
    vscode.window.registerWebviewViewProvider(AgentHudViewProvider.viewType, hudProvider),
    registerGhostTextProvider(context, auth),
    registerPatchDecorations(context)
  );

  registerInlineChatCommands(context, auth);
  registerPatchCommands(context, auth);
  registerTerminalCommands(context, auth);

  context.subscriptions.push(
    vscode.commands.registerCommand("princy.signIn", async () => {
      const email = await vscode.window.showInputBox({ prompt: "Princy email", ignoreFocusOut: true });
      if (!email) return;
      const password = await vscode.window.showInputBox({
        prompt: "Princy password",
        password: true,
        ignoreFocusOut: true
      });
      if (!password) return;
      try {
        resetPrincyClient();
        const client = getPrincyClient(auth);
        const result = await client.login(email, password);
        await auth.setSession(result.accessToken, result.refreshToken, result.user);
        vscode.window.showInformationMessage(`Signed in as ${result.user.email}`);
        void linkWorkspace(auth);
        void trackRecentProject(context, vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
      } catch (err) {
        vscode.window.showErrorMessage(err instanceof Error ? err.message : "Login failed");
      }
    }),

    vscode.commands.registerCommand("princy.signOut", async () => {
      await auth.clear();
      resetPrincyClient();
      vscode.window.showInformationMessage("Signed out of Princy.");
    }),

    vscode.commands.registerCommand("princy.openChat", () => chatProvider.openInPanel()),
    vscode.commands.registerCommand("princy.openSwarm", () => swarmProvider.openInPanel()),
    vscode.commands.registerCommand("princy.openMemory", () => memoryProvider.openInPanel()),
    vscode.commands.registerCommand("princy.openMarketplace", () => marketplaceProvider.openInPanel()),
    vscode.commands.registerCommand("princy.openMcpCenter", () => mcpProvider.openInPanel()),
    vscode.commands.registerCommand("princy.openObservability", () => observabilityProvider.openInPanel()),
    vscode.commands.registerCommand("princy.openWorkspace", () => workspaceProvider.openInPanel()),
    vscode.commands.registerCommand("princy.openAgentHud", () => vscode.commands.executeCommand("princy.agentHudView.focus")),
    vscode.commands.registerCommand("princy.openSettings", () => openSettingsPanel(auth, context.extensionUri)),
    vscode.commands.registerCommand("princy.openStartupHub", () => openStartupHub(auth, context.extensionUri, context.globalState)),
    vscode.commands.registerCommand("princy.openPatchPanel", () => openPatchPanel(auth, context.extensionUri)),
    vscode.commands.registerCommand("princy.indexWorkspace", () => indexWorkspace(auth)),
    vscode.commands.registerCommand("princy.openContextGraph", () => openContextGraph(auth, context.extensionUri)),
    vscode.commands.registerCommand("princy.startAutonomous", () => startAutonomousMode(auth, context.extensionUri)),
    vscode.commands.registerCommand("princy.runAutonomousTask", () => startAutonomousMode(auth, context.extensionUri)),
    vscode.commands.registerCommand("princy.inlineEdit", () => vscode.commands.executeCommand("princy.quickChatSelection"))
  );

  const themeKey = "princy.defaultThemeApplied";
  if (!context.globalState.get(themeKey)) {
    try {
      await vscode.workspace.getConfiguration("workbench").update("colorTheme", "Princy Dark Neural", vscode.ConfigurationTarget.Global);
      await context.globalState.update(themeKey, true);
    } catch { /* optional */ }
  }

  const startupKey = "princy.startupHubShown";
  if (!context.globalState.get(startupKey)) {
    void openStartupHub(auth, context.extensionUri, context.globalState);
    await context.globalState.update(startupKey, true);
  }

  if (vscode.workspace.workspaceFolders?.length && (await auth.isSignedIn())) {
    void linkWorkspace(auth);
  }
}

async function trackRecentProject(context: vscode.ExtensionContext, path?: string): Promise<void> {
  if (!path) return;
  const key = "princy.recentProjects";
  const recent = context.globalState.get<Array<{ path: string; lastOpened: string }>>(key) ?? [];
  const filtered = recent.filter((p) => p.path !== path);
  filtered.unshift({ path, lastOpened: new Date().toISOString() });
  await context.globalState.update(key, filtered.slice(0, 10));
}

export function deactivate(): void {
  resetPrincyClient();
}
