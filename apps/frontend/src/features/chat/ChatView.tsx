"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../design-system/Toast";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ChatSidebar } from "./ChatSidebar";
import { DEMO_MESSAGES } from "./chat-history";
import { useChatModels } from "./use-chat-models";
import { useChatStream } from "./use-chat-stream";

export function ChatView() {
  const [message, setMessage] = useState("");
  const [thinking, setThinking] = useState(false);
  const [agentType, setAgentType] = useState("AUTO");
  const [activeChatId, setActiveChatId] = useState("demo-1");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const toast = useToast();
  const { routedModel } = useChatModels();
  const { messages, status, streaming, error, conversationId, chatMetrics, send, clear, setMessages, loadConversation } =
    useChatStream();

  useEffect(() => {
    if (error) toast.show(error);
  }, [error, toast]);

  const displayMessages =
    messages.length > 0
      ? messages
      : activeChatId === "demo-1"
        ? DEMO_MESSAGES.map((m) => ({ ...m, streaming: false }))
        : [];

  return (
    <div className="chat-view">
      <ChatSidebar
        activeId={activeChatId}
        refreshKey={historyRefresh}
        onSelect={(id) => {
          setActiveChatId(id);
          if (id.startsWith("demo-")) {
            clear();
            return;
          }
          void loadConversation(id).catch(() => {
            clear();
            toast.show("Não foi possível carregar a conversa");
          });
        }}
        onNewChat={() => {
          clear();
          setActiveChatId("new");
        }}
      />
      <div className="chat-view__main">
        <div className="chat-view__meta">
          {status ? <span className="chat-view__status">{status}</span> : null}
          {chatMetrics ? (
            <span className="chat-view__metrics">
              {chatMetrics.model ? `${chatMetrics.model}` : ""}
              {chatMetrics.ttftMs !== undefined ? ` · TTFT ${chatMetrics.ttftMs}ms` : ""}
              {chatMetrics.tokensPerSec ? ` · ${chatMetrics.tokensPerSec} tok/s` : ""}
              {chatMetrics.cacheHit ? " · cache" : ""}
            </span>
          ) : null}
        </div>
        <div className="chat-view__messages">
          {displayMessages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
        </div>
        <ChatInput
          value={message}
          onChange={setMessage}
          thinking={thinking}
          onThinkingChange={setThinking}
          agentType={agentType}
          onAgentTypeChange={setAgentType}
          routedModel={routedModel}
          disabled={streaming}
          onSend={() => {
            if (!message.trim() || streaming) return;
            void send(message.trim(), agentType, thinking, {
              conversationId:
                activeChatId.startsWith("demo-") || activeChatId === "new" ? conversationId : activeChatId
            });
            setHistoryRefresh((n) => n + 1);
            setMessage("");
          }}
        />
      </div>
    </div>
  );
}
