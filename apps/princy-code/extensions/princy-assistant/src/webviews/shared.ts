import * as vscode from "vscode";
import { premiumStyles as sharedPremiumStyles } from "@princy/extension-shared";

export function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

export function princyStyles(): string {
  return sharedPremiumStyles();
}

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    enableScripts: true,
    localResourceRoots: [
      extensionUri,
      vscode.Uri.joinPath(extensionUri, "media", "webviews")
    ]
  };
}
