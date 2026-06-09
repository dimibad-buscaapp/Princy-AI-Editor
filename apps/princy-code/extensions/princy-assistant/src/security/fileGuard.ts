import * as path from "node:path";
import * as vscode from "vscode";
import type { AuthService } from "../auth.js";

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

const WRITE_ROLES = new Set(["admin", "developer", "owner"]);

export async function checkRbacWrite(auth: AuthService, action: string): Promise<boolean> {
  const user = await auth.getUser();
  if (!user) {
    vscode.window.showWarningMessage(`Sign in to ${action}.`);
    return false;
  }
  if (!WRITE_ROLES.has(user.role.toLowerCase())) {
    const override = await vscode.window.showWarningMessage(
      `Role "${user.role}" may not ${action}. Continue anyway?`,
      "Continue",
      "Cancel"
    );
    return override === "Continue";
  }
  return true;
}

export async function checkMemoryWritePermission(auth: AuthService): Promise<boolean> {
  return checkRbacWrite(auth, "modify memory");
}

export async function checkPatchWritePermission(auth: AuthService): Promise<boolean> {
  return checkRbacWrite(auth, "apply patches");
}

export async function checkAutonomousPermission(auth: AuthService): Promise<boolean> {
  const enabled = vscode.workspace.getConfiguration("princy").get<boolean>("enableAutonomousMode", false);
  if (!enabled) {
    vscode.window.showWarningMessage("Enable princy.enableAutonomousMode in settings first.");
    return false;
  }
  return checkRbacWrite(auth, "run autonomous mode");
}
