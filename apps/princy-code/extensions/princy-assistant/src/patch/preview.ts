import * as vscode from "vscode";
import type { AuthService } from "../auth.js";
import { withClient } from "../princyClient.js";

let lastPatchId: string | undefined;

export async function previewPatchById(auth: AuthService, patchId: string): Promise<void> {
  const result = await withClient(auth, (c) => c.patchPreview(patchId));
  if (!result) return;
  lastPatchId = patchId;
  const { preview } = result;
  const original = await vscode.workspace.openTextDocument({
    content: preview.original,
    language: "plaintext"
  });
  const modified = await vscode.workspace.openTextDocument({
    content: preview.modified,
    language: "plaintext"
  });
  await vscode.commands.executeCommand(
    "vscode.diff",
    original.uri,
    modified.uri,
    `Princy Patch: ${preview.filePath}`
  );
}

export async function applyPatchById(auth: AuthService, patchId: string): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    `Apply patch ${patchId}?`,
    { modal: true },
    "Apply",
    "Cancel"
  );
  if (confirm !== "Apply") return;
  const result = await withClient(auth, (c) => c.patchApply(patchId));
  if (result) {
    lastPatchId = patchId;
    vscode.window.showInformationMessage("Patch applied successfully.");
  }
}

export async function rollbackPatchById(auth: AuthService, patchId: string): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    `Rollback patch ${patchId}?`,
    { modal: true },
    "Rollback",
    "Cancel"
  );
  if (confirm !== "Rollback") return;
  await withClient(auth, (c) => c.patchRollback(patchId));
  vscode.window.showInformationMessage("Patch rolled back.");
}

export function registerPatchCommands(context: vscode.ExtensionContext, auth: AuthService): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("princy.previewPatch", async () => {
      const patchId = await vscode.window.showInputBox({
        prompt: "Patch ID to preview",
        value: lastPatchId
      });
      if (!patchId) return;
      await previewPatchById(auth, patchId);
    }),

    vscode.commands.registerCommand("princy.applyPatch", async () => {
      const patchId = await vscode.window.showInputBox({
        prompt: "Patch ID to apply",
        value: lastPatchId
      });
      if (!patchId) return;
      await applyPatchById(auth, patchId);
    }),

    vscode.commands.registerCommand("princy.rollbackPatch", async () => {
      const patchId = await vscode.window.showInputBox({
        prompt: "Patch ID to rollback",
        value: lastPatchId
      });
      if (!patchId) return;
      await rollbackPatchById(auth, patchId);
    })
  );
}
