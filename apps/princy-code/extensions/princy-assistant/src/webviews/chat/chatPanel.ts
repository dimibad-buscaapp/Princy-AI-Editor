import * as vscode from "vscode";
import type { AuthService } from "../../auth.js";
import { guardEditorContent, guardSelection } from "../../security/fileGuard.js";
import { getPrincyClient, linkWorkspace, withClient } from "../../princyClient.js";
import { getWebviewOptions } from "../shared.js";
import { bindWebviewMessages, postToWebview, renderReactWebview } from "../reactHost.js";

type Attachment = { type: string; content: string; label: string };

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "princy.chatView";
  private view?: vscode.WebviewView;
  private conversationId?: string;
  private projectId?: string;
  private pendingAttachments: Attachment[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly auth: AuthService
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = getWebviewOptions(this.extensionUri);
    this.setupWebview(webviewView.webview);
  }

  async openInPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      "princyChat",
      "Princy Chat",
      vscode.ViewColumn.Beside,
      { ...getWebviewOptions(this.extensionUri), retainContextWhenHidden: true }
    );
    this.setupWebview(panel.webview);
  }

  private setupWebview(webview: vscode.Webview): void {
    webview.html = renderReactWebview(webview, this.extensionUri, "chat");
    bindWebviewMessages(webview, async (msg) => {
      if (msg.type === "ready") await this.sendInit(webview);
      if (msg.type === "send") {
        await this.handleSend(webview, {
          text: msg.text as string,
          agentType: msg.agentType as string | undefined,
          thinkingMode: msg.thinkingMode as boolean | undefined,
          attachments: msg.attachments as unknown[] | undefined
        });
      }
      if (msg.type === "attachFile") await this.handleAttachFile(webview);
      if (msg.type === "attachSelection") await this.handleAttachSelection(webview);
      if (msg.type === "clear") {
        this.conversationId = undefined;
        this.pendingAttachments = [];
        postToWebview(webview, { type: "cleared" });
      }
      if (msg.type === "newConversation") await this.newConversation(webview);
      if (msg.type === "selectConversation") await this.loadConversation(webview, msg.id as string);
    });
  }

  private async sendInit(webview: vscode.Webview): Promise<void> {
    const conversations = await withClient(this.auth, async (c) => {
      try {
        const r = await c.conversationsList(this.projectId);
        return r.conversations.map((conv) => ({
          id: conv.id,
          title: conv.title ?? conv.id.slice(0, 8)
        }));
      } catch {
        return [];
      }
    });
    postToWebview(webview, {
      type: "init",
      conversations: conversations ?? [],
      conversationId: this.conversationId,
      messages: []
    });
  }

  private async newConversation(webview: vscode.Webview): Promise<void> {
    const created = await withClient(this.auth, (c) => c.conversationCreate(undefined, this.projectId));
    if (created?.conversation.id) {
      this.conversationId = created.conversation.id;
      postToWebview(webview, { type: "cleared" });
      await this.sendInit(webview);
    }
  }

  private async loadConversation(webview: vscode.Webview, id: string): Promise<void> {
    const history = await withClient(this.auth, (c) => c.conversationHistory(id));
    if (!history) return;
    this.conversationId = id;
    postToWebview(webview, {
      type: "init",
      conversationId: id,
      messages: history.messages.map((m) => ({ role: m.role, content: m.content }))
    });
  }

  private async handleAttachFile(webview: vscode.Webview): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    const content = await guardEditorContent(editor);
    if (!content) return;
    const path = editor?.document.uri.fsPath ?? "file";
    const att = { type: "file", label: path, content: content.slice(0, 8000) };
    this.pendingAttachments.push(att);
    postToWebview(webview, { type: "attachment", attachment: { type: att.type, label: att.label } });
  }

  private async handleAttachSelection(webview: vscode.Webview): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    const content = await guardSelection(editor);
    if (!content) return;
    const att = { type: "selection", label: "selection", content };
    this.pendingAttachments.push(att);
    postToWebview(webview, { type: "attachment", attachment: { type: att.type, label: att.label } });
  }

  private async handleSend(
    webview: vscode.Webview,
    msg: { text?: string; agentType?: string; thinkingMode?: boolean; attachments?: unknown[] }
  ): Promise<void> {
    const text = msg.text as string;
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

    const attachments = this.pendingAttachments.map((a) => ({
      type: a.type,
      content: a.content,
      label: a.label
    }));
    this.pendingAttachments = [];

    const client = getPrincyClient(this.auth);
    const startMs = Date.now();
    try {
      await client.chatStream(text, {
        conversationId: this.conversationId,
        projectId: this.projectId,
        agentType: (msg.agentType as string) ?? "CODER",
        thinkingMode: msg.thinkingMode !== false,
        attachments,
        onEvent: (event) => {
          if (event.type === "token") {
            postToWebview(webview, { type: "token", text: event.content });
          } else if (event.type === "thinking") {
            postToWebview(webview, { type: "thinking", text: event.content });
          } else if (event.type === "status") {
            postToWebview(webview, { type: "thinking", text: event.message });
          } else if (event.type === "error") {
            postToWebview(webview, { type: "error", message: event.message });
          } else if (event.type === "done") {
            if (event.conversationId) this.conversationId = event.conversationId;
            postToWebview(webview, {
              type: "done",
              conversationId: event.conversationId,
              model: event.model,
              ttftMs: Date.now() - startMs
            });
          }
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat failed";
      postToWebview(webview, { type: "error", message });
      postToWebview(webview, { type: "done" });
    }
  }
}
