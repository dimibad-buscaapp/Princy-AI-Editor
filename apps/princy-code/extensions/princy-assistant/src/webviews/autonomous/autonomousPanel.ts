import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { getPrincyClient, withClient } from "../../princyClient.js";
import { checkAutonomousPermission } from "../../security/fileGuard.js";
import { previewPatchById } from "../../patch/preview.js";
import { getWebviewOptions } from "../shared.js";
import { bindWebviewMessages, postToWebview, renderReactWebview } from "../reactHost.js";

let activeRunId: string | undefined;
let sseAbort: AbortController | undefined;

export async function startAutonomousMode(auth: AuthService, extensionUri: vscode.Uri): Promise<void> {
  if (!(await checkAutonomousPermission(auth))) return;

  const panel = vscode.window.createWebviewPanel(
    "princyAutonomous",
    "Princy Autonomous",
    vscode.ViewColumn.Beside,
    { ...getWebviewOptions(extensionUri), retainContextWhenHidden: true }
  );
  setupAutonomousWebview(panel.webview, auth, extensionUri);
}

function setupAutonomousWebview(webview: vscode.Webview, auth: AuthService, extensionUri: vscode.Uri): void {
  webview.html = renderReactWebview(webview, extensionUri, "autonomous");
  bindWebviewMessages(webview, async (msg) => {
    if (msg.type === "run") {
      const objective = msg.objective as string;
      postToWebview(webview, { type: "running", value: true });
      postToWebview(webview, { type: "steps", steps: [{ phase: "Plan", status: "running" }] });
      void connectAutonomousSse(webview, auth);
      const result = await withClient(auth, (c) => c.autonomousRun(objective));
      if (result) {
        postToWebview(webview, {
          type: "steps",
          steps: [
            { phase: "Plan", status: "done", message: result.plan },
            { phase: "Execute", status: "done", message: result.output }
          ]
        });
      }
      postToWebview(webview, { type: "running", value: false });
      postToWebview(webview, { type: "done" });
    }
    if (msg.type === "cancel" && activeRunId) {
      await withClient(auth, (c) => c.autonomousCancel(activeRunId!));
      sseAbort?.abort();
      postToWebview(webview, { type: "running", value: false });
    }
    if (msg.type === "approve") {
      await withClient(auth, (c) => c.automationApprove(msg.id as string));
    }
    if (msg.type === "reject") {
      await withClient(auth, (c) => c.automationReject(msg.id as string));
    }
    if (msg.type === "previewPatch") {
      await previewPatchById(auth, msg.patchId as string);
    }
  });
}

async function connectAutonomousSse(webview: vscode.Webview, auth: AuthService): Promise<void> {
  sseAbort?.abort();
  sseAbort = new AbortController();
  const token = await auth.getToken();
  const url = getPrincyClient(auth).eventsStreamUrl();
  try {
    const headers: Record<string, string> = { Accept: "text/event-stream" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { headers, signal: sseAbort.signal });
    if (!response.ok || !response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const dataLine = part.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        try {
          const data = JSON.parse(dataLine.slice(5).trim()) as {
            type?: string;
            phase?: string;
            status?: string;
            message?: string;
            runId?: string;
          };
          if (data.runId) activeRunId = data.runId;
          if (data.type?.includes("approval")) {
            postToWebview(webview, {
              type: "approvals",
              approvals: [{ id: data.runId ?? "1", description: data.message ?? "Approval required" }]
            });
          }
          if (data.phase) {
            postToWebview(webview, {
              type: "step",
              step: { phase: data.phase, status: data.status ?? "running", message: data.message }
            });
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* SSE optional */
  }
}
