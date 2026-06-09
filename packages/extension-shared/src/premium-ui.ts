/** Premium Princy Neural UI styles for VS Code webviews. */
export function premiumStyles(): string {
  return `
    :root {
      --bg: #0a0518;
      --panel: rgba(10, 5, 24, 0.85);
      --glass: rgba(15, 10, 35, 0.72);
      --purple: #622AF3;
      --violet: #8B5CF6;
      --cyan: #00f2ff;
      --neon: #a855f7;
      --text: #e8f4ff;
      --muted: #94A3B8;
      --border: rgba(0, 242, 255, 0.22);
      --glow: 0 0 20px rgba(0, 242, 255, 0.15);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      display: flex; gap: 8px; padding: 8px 12px;
      background: var(--glass);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      align-items: center; flex-wrap: wrap;
    }
    .badge {
      font-size: 11px; padding: 2px 10px; border-radius: 999px;
      background: rgba(98, 42, 243, 0.3); color: var(--cyan);
      border: 1px solid var(--border);
    }
    .badge.pulse { animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse {
      0%, 100% { box-shadow: var(--glow); opacity: 1; }
      50% { box-shadow: 0 0 28px rgba(168, 85, 247, 0.35); opacity: 0.85; }
    }
    @keyframes typing {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes streamCursor {
      0%, 100% { border-color: var(--cyan); }
      50% { border-color: transparent; }
    }
    @keyframes neuralLink {
      0% { stroke-dashoffset: 100; opacity: 0.3; }
      50% { opacity: 1; }
      100% { stroke-dashoffset: 0; opacity: 0.3; }
    }
    @keyframes agentHandoff {
      0% { transform: translateX(-4px); opacity: 0.6; }
      50% { transform: translateX(4px); opacity: 1; }
      100% { transform: translateX(0); opacity: 0.8; }
    }
    .thinking-block {
      margin: 8px 0; padding: 12px 14px;
      border-radius: 10px;
      background: var(--glass);
      border: 1px solid rgba(168, 85, 247, 0.35);
      box-shadow: var(--glow);
    }
    .thinking-block h4 {
      margin: 0 0 8px; color: var(--cyan); font-size: 12px;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .thinking-block .subtask {
      font-size: 12px; color: var(--muted); padding: 4px 0;
      border-left: 2px solid var(--violet); padding-left: 8px; margin: 4px 0;
    }
    button {
      background: linear-gradient(90deg, var(--cyan), var(--neon));
      color: #0a0518; border: none; border-radius: 6px;
      padding: 6px 12px; cursor: pointer; font-size: 12px; font-weight: 600;
    }
    button.secondary {
      background: transparent; border: 1px solid var(--border);
      color: var(--text); font-weight: 500;
    }
    button:hover { opacity: 0.92; filter: brightness(1.05); }
    .messages, .content, .panel-body {
      flex: 1; overflow-y: auto; padding: 12px;
    }
    .msg {
      margin-bottom: 12px; padding: 10px 12px; border-radius: 10px;
      line-height: 1.55; word-break: break-word;
    }
    .msg.user {
      background: rgba(59, 130, 246, 0.12);
      border-left: 3px solid #3B82F6;
    }
    .msg.assistant {
      background: rgba(98, 42, 243, 0.1);
      border-left: 3px solid var(--purple);
    }
    .msg.system { color: var(--muted); font-size: 12px; background: transparent; }
    .msg.streaming::after {
      content: ''; display: inline-block; width: 2px; height: 1em;
      background: var(--cyan); margin-left: 2px; vertical-align: text-bottom;
      animation: streamCursor 0.8s step-end infinite;
    }
    .msg pre, .msg code {
      background: rgba(0,0,0,0.35); padding: 2px 6px; border-radius: 4px;
      font-family: 'Cascadia Code', Consolas, monospace; font-size: 12px;
    }
    .msg pre { padding: 10px; overflow-x: auto; display: block; margin: 8px 0; }
    .input-row {
      display: flex; gap: 8px; padding: 12px;
      background: var(--glass); border-top: 1px solid var(--border);
    }
    textarea, input[type="text"], select {
      flex: 1; background: var(--bg); color: var(--text);
      border: 1px solid var(--border); border-radius: 8px;
      padding: 10px; font-family: inherit;
    }
    textarea { resize: none; }
    .agent-card {
      padding: 12px; margin-bottom: 10px; border-radius: 10px;
      background: var(--glass); border: 1px solid var(--border);
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .agent-card.active {
      border-color: var(--cyan); box-shadow: var(--glow);
      animation: pulse 2.5s ease-in-out infinite;
    }
    .agent-card .status { color: var(--cyan); font-size: 12px; margin-top: 4px; }
    .agent-card .model { color: var(--muted); font-size: 11px; }
    .neural-links {
      height: 48px; margin: 8px 0; position: relative;
      background: linear-gradient(90deg, transparent, rgba(0,242,255,0.08), transparent);
      border-radius: 6px; overflow: hidden;
    }
    .neural-links::before {
      content: ''; position: absolute; inset: 50% 0 auto;
      height: 2px; background: linear-gradient(90deg, var(--purple), var(--cyan), var(--neon));
      animation: agentHandoff 2s ease-in-out infinite;
    }
    .tabs { display: flex; gap: 4px; padding: 8px 12px; border-bottom: 1px solid var(--border); }
    .tab {
      padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
      color: var(--muted); background: transparent; border: 1px solid transparent;
    }
    .tab.active { color: var(--cyan); border-color: var(--border); background: var(--glass); }
    .metric-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px; margin: 8px 0;
    }
    .metric {
      padding: 10px; border-radius: 8px; background: var(--glass);
      border: 1px solid var(--border); text-align: center;
    }
    .metric .value { font-size: 18px; color: var(--cyan); font-weight: 700; }
    .metric .label { font-size: 10px; color: var(--muted); text-transform: uppercase; }
    .timeline { border-left: 2px solid var(--border); margin-left: 8px; padding-left: 16px; }
    .timeline-item { margin-bottom: 12px; font-size: 12px; }
    .timeline-item .time { color: var(--muted); font-size: 10px; }
    .tool-running { animation: typing 1s ease-in-out infinite; color: var(--violet); }
    h2, h3 { color: var(--violet); font-size: 13px; margin: 12px 0 8px; }
    .empty { color: var(--muted); font-size: 12px; text-align: center; padding: 24px; }
  `;
}

export function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Simple markdown-lite: code fences + bold */
export function renderMarkdownLite(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => `<pre><code>${code}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\n/g, "<br/>");
  return html;
}
