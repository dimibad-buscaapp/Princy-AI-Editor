import * as vscode from "vscode";

export function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

export function princyStyles(): string {
  return `
    :root {
      --bg: #020617;
      --panel: #050816;
      --purple: #622AF3;
      --violet: #8B5CF6;
      --cyan: #22D3EE;
      --blue: #3B82F6;
      --text: #F8FAFC;
      --muted: #94A3B8;
      --border: rgba(110, 150, 255, 0.22);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      background: var(--panel);
      border-bottom: 1px solid var(--border);
      align-items: center;
    }
    .badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(98, 42, 243, 0.25);
      color: var(--violet);
      margin-left: auto;
    }
    button {
      background: var(--purple);
      color: var(--text);
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 12px;
    }
    button.secondary {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--muted);
    }
    button:hover { opacity: 0.9; }
    .messages, .content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    .msg {
      margin-bottom: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .msg.user { background: rgba(59, 130, 246, 0.15); border-left: 3px solid var(--blue); }
    .msg.assistant { background: rgba(98, 42, 243, 0.12); border-left: 3px solid var(--purple); }
    .msg.system { color: var(--muted); font-size: 12px; background: transparent; }
    .input-row {
      display: flex;
      gap: 8px;
      padding: 12px;
      background: var(--panel);
      border-top: 1px solid var(--border);
    }
    textarea, input[type="text"] {
      flex: 1;
      background: var(--bg);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      font-family: inherit;
      resize: none;
    }
    .agent-card {
      padding: 10px;
      margin-bottom: 8px;
      border-radius: 8px;
      background: rgba(5, 8, 22, 0.8);
      border: 1px solid var(--border);
    }
    .agent-card .status { color: var(--cyan); font-size: 12px; }
    .node { padding: 4px 0; color: var(--muted); font-size: 13px; }
  `;
}

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    enableScripts: true,
    localResourceRoots: [extensionUri]
  };
}
