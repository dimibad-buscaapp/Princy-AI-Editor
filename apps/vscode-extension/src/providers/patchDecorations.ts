import * as vscode from "vscode";

const PATCH_GLOB = new Set<string>();

export function registerPatchDecorations(context: vscode.ExtensionContext): vscode.Disposable {
  const provider: vscode.FileDecorationProvider = {
    provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
      const normalized = uri.fsPath.replace(/\\/g, "/");
      if (!PATCH_GLOB.has(normalized)) return undefined;
      return {
        badge: "P",
        tooltip: "Pending Princy patch",
        color: new vscode.ThemeColor("charts.yellow")
      };
    }
  };
  return vscode.window.registerFileDecorationProvider(provider);
}

export function markPatchPending(filePath: string): void {
  PATCH_GLOB.add(filePath.replace(/\\/g, "/"));
}

export function clearPatchPending(filePath: string): void {
  PATCH_GLOB.delete(filePath.replace(/\\/g, "/"));
}

export async function trackPatchesFromList(
  patches: Array<{ filePath: string; status: string }>
): Promise<void> {
  PATCH_GLOB.clear();
  for (const p of patches) {
    if (p.status === "pending" || p.status === "preview") {
      PATCH_GLOB.add(p.filePath.replace(/\\/g, "/"));
    }
  }
}
