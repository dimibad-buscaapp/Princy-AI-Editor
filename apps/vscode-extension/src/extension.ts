import * as vscode from "vscode";
import { AuthService } from "./auth.js";
import { getPrincyClient, linkWorkspace, resetPrincyClient, withClient } from "./princyClient.js";
import { registerGhostTextProvider } from "./providers/ghostText.js";
import { registerInlineChatCommands } from "./providers/inlineChat.js";
import { registerPatchCommands } from "./patch/preview.js";
import { registerTerminalCommands } from "./terminal/monitor.js";
import { ChatViewProvider } from "./webviews/chat/chatPanel.js";
import { SwarmViewProvider } from "./webviews/swarm/swarmPanel.js";
import { indexWorkspace, openContextGraph } from "./webviews/context/contextPanel.js";
import { startAutonomousMode } from "./webviews/autonomous/autonomousPanel.js";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const auth = new AuthService(context.secrets);

  const chatProvider = new ChatViewProvider(context.extensionUri, auth);
  const swarmProvider = new SwarmViewProvider(context.extensionUri, auth);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatProvider),
    vscode.window.registerWebviewViewProvider(SwarmViewProvider.viewType, swarmProvider),
    registerGhostTextProvider(context, auth)
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
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        vscode.window.showErrorMessage(message);
      }
    }),

    vscode.commands.registerCommand("princy.signOut", async () => {
      await auth.clear();
      resetPrincyClient();
      vscode.window.showInformationMessage("Signed out of Princy.");
    }),

    vscode.commands.registerCommand("princy.openChat", () => chatProvider.openInPanel()),
    vscode.commands.registerCommand("princy.openSwarm", () => swarmProvider.openInPanel()),
    vscode.commands.registerCommand("princy.indexWorkspace", () => indexWorkspace(auth)),
    vscode.commands.registerCommand("princy.openContextGraph", () =>
      openContextGraph(auth, context.extensionUri)
    ),
    vscode.commands.registerCommand("princy.startAutonomous", () =>
      startAutonomousMode(auth, context.extensionUri)
    )
  );

  if (vscode.workspace.workspaceFolders?.length && (await auth.isSignedIn())) {
    void linkWorkspace(auth);
  }
}

export function deactivate(): void {
  resetPrincyClient();
}
