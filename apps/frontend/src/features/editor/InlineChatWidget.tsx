"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { GlowButton } from "../../design-system/GlowButton";
import { getAccessToken } from "../../lib/token-storage";

const ACTIONS = [
  { id: "refactor", label: "Refatorar" },
  { id: "explain", label: "Explicar" },
  { id: "optimize", label: "Otimizar" },
  { id: "document", label: "Documentar" },
  { id: "tests", label: "Criar testes" },
  { id: "fix", label: "Corrigir bugs" }
] as const;

type InlineChatWidgetProps = {
  selection: string;
  filePath: string;
  onClose: () => void;
};

export function InlineChatWidget({ selection, filePath, onClose }: InlineChatWidgetProps) {
  const [action, setAction] = useState<(typeof ACTIONS)[number]["id"]>("explain");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    setResponse("");
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
    const token = getAccessToken();
    try {
      const res = await fetch(`${apiBase}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: `[${action}] ${selection}`,
          context: { filePath, selection },
          agentType: "CODER"
        })
      });
      if (!res.ok || !res.body) {
        setResponse("Erro ao conectar com Princy IA.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload) as { token?: string; content?: string };
            setResponse((r) => r + (parsed.token ?? parsed.content ?? ""));
          } catch {
            /* ignore partial */
          }
        }
      }
    } catch {
      setResponse("Falha na conexão SSE.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="princy-inline-chat glass-panel luminous-border">
      <header className="princy-inline-chat__header">
        <Sparkles size={14} />
        <span>Ask Princy</span>
        <button type="button" className="princy-inline-chat__close" onClick={onClose} aria-label="Fechar">
          <X size={14} />
        </button>
      </header>
      <div className="princy-inline-chat__actions">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={action === a.id ? "active" : ""}
            onClick={() => setAction(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>
      <GlowButton variant="violet" onClick={ask} disabled={loading}>
        {loading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
        Perguntar
      </GlowButton>
      {response ? <pre className="princy-inline-chat__response">{response}</pre> : null}
    </div>
  );
}
