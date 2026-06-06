"use client";

import { useRouter } from "next/navigation";
import { BetaBadge } from "../../design-system/BetaBadge";
import { inferRouterTier, routerTierLabel } from "../../lib/router-tier";
import { apiPost } from "../../lib/api-client";
import type { ChatMetrics } from "./use-chat-stream";

type ChatHeaderProps = {
  model?: string;
  routedModel?: string;
  chatMetrics: ChatMetrics | null;
  status: string;
  streaming: boolean;
  thinking: boolean;
  agentType: string;
  lastAssistantContent?: string;
  lastUserMessage?: string;
  onClear: () => void;
  onCopy?: () => void;
};

export function ChatHeader({
  model,
  routedModel,
  chatMetrics,
  status,
  streaming,
  thinking,
  agentType,
  lastAssistantContent,
  lastUserMessage,
  onClear,
  onCopy
}: ChatHeaderProps) {
  const router = useRouter();
  const activeModel = chatMetrics?.model ?? model ?? routedModel ?? "auto";
  const tier = inferRouterTier(activeModel);
  const isThinking = thinking || streaming && status.toLowerCase().includes("memória");
  const isRunningTool = agentType !== "AUTO" || status.toLowerCase().includes("tool");

  const handleCopy = () => {
    if (lastAssistantContent) {
      void navigator.clipboard.writeText(lastAssistantContent);
    }
    onCopy?.();
  };

  const handleWorkspace = () => {
    const prompt = lastUserMessage ?? lastAssistantContent ?? "";
    router.push(`/editor/demo?prompt=${encodeURIComponent(prompt.slice(0, 500))}`);
  };

  const handleAutonomous = async () => {
    if (!lastUserMessage) return;
    try {
      await apiPost("/agents/autonomous/run", { objective: lastUserMessage });
    } catch {
      /* toast handled by parent */
    }
  };

  return (
    <header className="chat-header beta-card">
      <div className="chat-header__left">
        <span className="chat-header__title">Chat Princy</span>
        <span className="chat-header__model" title={activeModel}>
          {activeModel}
        </span>
        <BetaBadge variant={tier === "fast" ? "fast" : tier === "code" ? "code" : tier === "reasoning" ? "reasoning" : "muted"}>
          {routerTierLabel(tier)}
        </BetaBadge>
        {chatMetrics?.cacheHit ? <BetaBadge variant="success">Cache hit</BetaBadge> : null}
        {isThinking ? <BetaBadge variant="reasoning">Thinking</BetaBadge> : null}
        {streaming && !isThinking ? <BetaBadge variant="muted">Typing</BetaBadge> : null}
        {isRunningTool ? <BetaBadge variant="code">Running tool</BetaBadge> : null}
      </div>
      <div className="chat-header__actions">
        <button type="button" className="beta-tab" onClick={handleCopy} disabled={!lastAssistantContent} title="Copiar resposta">
          Copiar
        </button>
        <button type="button" className="beta-tab" onClick={onClear} title="Limpar chat">
          Limpar
        </button>
        <button type="button" className="beta-tab" onClick={handleWorkspace} title="Enviar para workspace">
          Workspace
        </button>
        <button
          type="button"
          className="beta-tab"
          onClick={() => void handleAutonomous()}
          disabled={!lastUserMessage}
          title="Executar como tarefa autônoma"
        >
          Autônomo
        </button>
      </div>
      {chatMetrics ? (
        <div className="chat-header__metrics">
          {chatMetrics.ttftMs !== undefined ? `TTFT ${chatMetrics.ttftMs}ms` : ""}
          {chatMetrics.tokensPerSec ? ` · ${chatMetrics.tokensPerSec} tok/s` : ""}
        </div>
      ) : null}
    </header>
  );
}
