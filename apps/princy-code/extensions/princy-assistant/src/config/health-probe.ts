import * as vscode from "vscode";
import type { AuthService } from "../auth.js";
import { getPrincyClient } from "../princyClient.js";

export async function probeGatewayHealth(auth: AuthService): Promise<{
  ok: boolean;
  status?: string;
  error?: string;
}> {
  try {
    const client = getPrincyClient(auth);
    const health = await client.systemHealth();
    const status = typeof health.status === "string" ? health.status : "ok";
    return { ok: true, status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health check failed";
    return { ok: false, error: message };
  }
}

export async function runStartupHealthCheck(auth: AuthService): Promise<void> {
  const result = await probeGatewayHealth(auth);
  if (result.ok) {
    vscode.window.setStatusBarMessage(`Princy VPS: ${result.status ?? "healthy"}`, 5000);
  } else {
    vscode.window.showWarningMessage(
      `Princy gateway unreachable: ${result.error ?? "unknown"}. Check princy.endpoint in settings.`
    );
  }
}
