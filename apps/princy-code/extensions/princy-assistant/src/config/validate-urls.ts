import * as vscode from "vscode";
import { isLoopbackUrl, PRINCY_URL_SETTING_KEYS } from "@princy/extension-shared";

export function validatePrincySettings(): string[] {
  const config = vscode.workspace.getConfiguration("princy");
  const errors: string[] = [];

  for (const key of PRINCY_URL_SETTING_KEYS) {
    const value = config.get<string>(key.replace("princy.", ""));
    if (value && isLoopbackUrl(value)) {
      errors.push(`${key} must not use localhost or 127.0.0.1 (VPS-only policy)`);
    }
  }

  return errors;
}

export async function showValidationErrors(errors: string[]): Promise<void> {
  if (errors.length === 0) return;
  const message = errors.join("\n");
  const action = await vscode.window.showErrorMessage(
    `Princy settings invalid:\n${errors[0]}`,
    "Open Settings"
  );
  if (action === "Open Settings") {
    await vscode.commands.executeCommand("workbench.action.openSettings", "princy");
  }
  console.error("[Princy] Settings validation failed:", message);
}
