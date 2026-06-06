import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { guardEditorContent, guardSelection } from "../../security/fileGuard.js";
import { getPrincyClient, linkWorkspace } from "../../princyClient.js";
import { getNonce, getWebviewOptions, princyStyles } from "../shared.js";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "princy.chatView";
  private view?: vscode.WebviewView;
  private conversationId?: string;
  private projectId?: string;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly auth: AuthService
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;
    webviewView.webview.options = getWebviewOptions(this.extensionUri);
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "send") await this.handleSend(msg.text);
      if (msg.type === "attachFile") await this.handleAttachFile();
      if (msg.type === "attachSelection") await this.handleAttachSelection();
      if (msg.type === "clear") {
        this.conversationId = undefined;
        this.post({ type: "cleared" });
      }
    });
  }

  async openInPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      "princyChat",
      "Princy Chat",
      vscode.ViewColumn.Beside,
      { ...getWebviewOptions(this.extensionUri), retainContextWhenHidden: true }
    );
    panel.webview.html = this.getHtml(panel.webview);
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "send") await this.handleSend(msg.text, panel.webview);
      if (msg.type === "attachFile") await this.handleAttachFile(panel.webview);
      if (msg.type === "attachSelection") await this.handleAttachSelection(panel.webview);
      if (msg.type === "clear") {
        this.conversationId = undefined;
        panel.webview.postMessage({ type: "cleared" });
      }
    });
  }

  private post(msg: unknown, webview?: vscode.Webview) {
    (webview ?? this.view?.webview)?.postMessage(msg);
  }

  private async handleAttachFile(webview?: vscode.Webview) {
    const editor = vscode.window.activeTextEditor;
    const content = await guardEditorContent(editor);
    if (!content) return;
    const path = editor?.document.uri.fsPath ?? "file";
    this.post({ type: "attachment", label: path, content: content.slice(0, 8000) }, webview);
  }

  private async handleAttachSelection(webview?: vscode.Webview) {
    const editor = vscode.window.activeTextEditor;
    const content = await guardSelection(editor);
    if (!content) return;
    this.post({ type: "attachment", label: "selection", content }, webview);
  }

  private async handleSend(text: string, webview?: vscode.Webview) {
    if (!(await this.auth.isSignedIn())) {
      vscode.window.showWarningMessage("Sign in to Princy first.");
      return;
    }

    if (!this.projectId) {
      const ws = await linkWorkspace(this.auth);
      if (ws) {
        const linked = await getPrincyClient(this.auth).workspaceLink(
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? ""
        );
        this.projectId = linked.workspace.projectId;
      }
    }

    const client = getPrincyClient(this.auth);
    this.post({ type: "user", content: text }, webview);
    this.post({ type: "streamStart" }, webview);

    let assistant = "";
    try {
      await client.chatStream(text, {
        conversationId: this.conversationId,
        projectId: this.projectId,
        onEvent: (event) => {
          if (event.type === "token") {
            assistant += event.content;
            this.post({ type: "token", content: event.content }, webview);
          } else if (event.type === "status") {
            this.post({ type: "status", content: event.message }, webview);
          } else if (event.type === "error") {
            this.post({ type: "error", content: event.message }, webview);
          } else if (event.type === "done") {
            if (event.conversationId) this.conversationId = event.conversationId;
            this.post({ type: "streamEnd", model: event.model }, webview);
          }
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat failed";
      this.post({ type: "error", content: message }, webview);
      this.post({ type: "streamEnd" }, webview);
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <style>${princyStyles()}</style>
</head>
<body>
  <div class="toolbar">
    <button class="secondary" id="attachFile">Attach File</button>
    <button class="secondary" id="attachSelection">Attach Selection</button>
    <button class="secondary" id="clear">Clear</button>
    <span class="badge" id="modelBadge">Princy Router</span>
  </div>
  <div class="messages" id="messages"></div>
  <div class="input-row">
    <textarea id="input" rows="2" placeholder="Ask Princy..."></textarea>
    <button id="send">Send</button>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const modelBadge = document.getElementById('modelBadge');
    let streaming = false;

    function append(cls, text) {
      const el = document.createElement('div');
      el.className = 'msg ' + cls;
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
      return el;
    }

    let currentAssistant = null;
    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (msg.type === 'user') append('user', msg.content);
      if (msg.type === 'attachment') append('system', 'Attached: ' + msg.label);
      if (msg.type === 'streamStart') { streaming = true; currentAssistant = append('assistant', ''); }
      if (msg.type === 'token' && currentAssistant) { currentAssistant.textContent += msg.content; messages.scrollTop = messages.scrollHeight; }
      if (msg.type === 'status') append('system', msg.content);
      if (msg.type === 'error') append('system', 'Error: ' + msg.content);
      if (msg.type === 'streamEnd') { streaming = false; if (msg.model) modelBadge.textContent = msg.model; currentAssistant = null; }
      if (msg.type === 'cleared') messages.innerHTML = '';
    });

    document.getElementById('send').onclick = () => {
      const text = input.value.trim();
      if (!text || streaming) return;
      input.value = '';
      vscode.postMessage({ type: 'send', text });
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('send').click(); }
    });
    document.getElementById('attachFile').onclick = () => vscode.postMessage({ type: 'attachFile' });
    document.getElementById('attachSelection').onclick = () => vscode.postMessage({ type: 'attachSelection' });
    document.getElementById('clear').onclick = () => vscode.postMessage({ type: 'clear' });
  </script>
</body>
</html>`;
  }
}
