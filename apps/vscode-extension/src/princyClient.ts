import { PrincyClient } from "@princy/vscode-api-client";
import * as vscode from "vscode";
import type { AuthService } from "./auth.js";

let client: PrincyClient | undefined;

export function getEndpoint(): string {
  return vscode.workspace.getConfiguration("princy").get<string>("endpoint") ?? "http://13.140.129.77:3407/api";
}

export function getPrincyClient(auth: AuthService): PrincyClient {
  if (!client) {
    client = new PrincyClient({
      baseUrl: getEndpoint(),
      getToken: () => auth.getToken(),
      onAuthError: async () => {
        vscode.window.showWarningMessage("Princy session expired. Please sign in again.");
      },
      chatTimeoutMs: 60_000,
      longTimeoutMs: 120_000
    });
  }
  return client;
}

export function resetPrincyClient(): void {
  client = undefined;
}

export async function ensureSignedIn(auth: AuthService): Promise<boolean> {
  if (await auth.isSignedIn()) return true;
  const choice = await vscode.window.showInformationMessage(
    "Sign in to Princy to use this feature.",
    "Sign In"
  );
  if (choice === "Sign In") {
    await vscode.commands.executeCommand("princy.signIn");
  }
  return await auth.isSignedIn();
}

export async function withClient<T>(
  auth: AuthService,
  fn: (client: PrincyClient) => Promise<T>
): Promise<T | undefined> {
  if (!(await ensureSignedIn(auth))) return undefined;
  try {
    return await fn(getPrincyClient(auth));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Princy request failed";
    vscode.window.showErrorMessage(message);
    return undefined;
  }
}

export async function linkWorkspace(auth: AuthService): Promise<string | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return undefined;
  const localPath = folders[0].uri.fsPath;
  const result = await withClient(auth, (c) => c.workspaceLink(localPath));
  return result?.workspace.id;
}
