"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../design-system/Toast";
import { ChatHeader } from "./ChatHeader";
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

  const lastAssistant = useMemo(
    () => [...displayMessages].reverse().find((m) => m.role === "assistant" && m.content),
    [displayMessages]
  );
  const lastUser = useMemo(
    () => [...displayMessages].reverse().find((m) => m.role === "user"),
    [displayMessages]
  );

  const isThinking =
    displayMessages.some((m) => "thinking" in m && Boolean(m.thinking)) ||
    status.toLowerCase().includes("memória");

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
        <ChatHeader
          routedModel={routedModel}
          chatMetrics={chatMetrics}
          status={status}
          streaming={streaming}
          thinking={thinking || isThinking}
          agentType={agentType}
          lastAssistantContent={lastAssistant?.content}
          lastUserMessage={lastUser?.content}
          onClear={clear}
          onCopy={() => toast.show("Resposta copiada")}
        />
        {isThinking ? (
          <div className="chat-view__thinking-banner" role="status">
            Pensando...
          </div>
        ) : null}
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
