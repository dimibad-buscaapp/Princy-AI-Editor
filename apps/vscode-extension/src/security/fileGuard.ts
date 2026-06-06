import * as path from "node:path";
import * as vscode from "vscode";

const BLOCKED_PATTERNS = [
  /^\.env(\..+)?$/i,
  /^id_rsa$/i,
  /\.pem$/i,
  /^credentials\.json$/i,
  /^\.ssh\//i
];

const CONFIRM_PATTERNS = [
  /^package-lock\.json$/i,
  /^docker-compose\.ya?ml$/i
];

export type GuardResult = { allowed: true } | { allowed: false; reason: string };

export function checkFilePath(filePath: string): GuardResult {
  const base = path.basename(filePath);
  const normalized = filePath.replace(/\\/g, "/");

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(base) || pattern.test(normalized)) {
      return { allowed: false, reason: `Blocked sensitive file: ${base}` };
    }
  }
  return { allowed: true };
}

export async function confirmIfSensitive(filePath: string): Promise<boolean> {
  const base = path.basename(filePath);
  const needsConfirm = CONFIRM_PATTERNS.some((p) => p.test(base));
  if (!needsConfirm) return true;

  const choice = await vscode.window.showWarningMessage(
    `Send ${base} to Princy API?`,
    { modal: true },
    "Send",
    "Cancel"
  );
  return choice === "Send";
}

export async function guardEditorContent(editor?: vscode.TextEditor): Promise<string | undefined> {
  if (!editor) return undefined;
  const guard = checkFilePath(editor.document.uri.fsPath);
  if (!guard.allowed) {
    vscode.window.showErrorMessage(guard.reason);
    return undefined;
  }
  const ok = await confirmIfSensitive(editor.document.uri.fsPath);
  if (!ok) return undefined;
  return editor.document.getText();
}

export async function guardSelection(editor?: vscode.TextEditor): Promise<string | undefined> {
  if (!editor || editor.selection.isEmpty) {
    vscode.window.showWarningMessage("Select code first.");
    return undefined;
  }
  const guard = checkFilePath(editor.document.uri.fsPath);
  if (!guard.allowed) {
    vscode.window.showErrorMessage(guard.reason);
    return undefined;
  }
  const ok = await confirmIfSensitive(editor.document.uri.fsPath);
  if (!ok) return undefined;
  return editor.document.getText(editor.selection);
}
