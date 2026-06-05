"use client";

import { useState } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ChatSidebar } from "./ChatSidebar";
import { DEMO_MESSAGES } from "./chat-history";
import { useChatStream } from "./use-chat-stream";

export function ChatView() {
  const [message, setMessage] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeChatId, setActiveChatId] = useState("1");
  const { messages, status, streaming, error, send, clear, setMessages } = useChatStream();

  const displayMessages =
    messages.length > 0
      ? messages
      : activeChatId === "1"
        ? DEMO_MESSAGES.map((m) => ({ ...m, streaming: false }))
        : [];

  return (
    <div className="chat-view">
      <ChatSidebar
        activeId={activeChatId}
        onSelect={setActiveChatId}
        onNewChat={() => {
          clear();
          setActiveChatId("new");
        }}
      />
      <div className="chat-view__main glass-panel luminous-border">
        {status ? <span className="chat-view__status">{status}</span> : null}
        <div className="chat-view__messages">
          {displayMessages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {error ? <p className="chat-view__error">{error}</p> : null}
        </div>
        <ChatInput
          value={message}
          onChange={setMessage}
          thinking={thinking}
          onThinkingChange={setThinking}
          disabled={streaming}
          onSend={() => {
            if (!message.trim() || streaming) return;
            if (messages.length === 0) setMessages([]);
            void send(message.trim(), "AUTO", thinking);
            setMessage("");
          }}
        />
      </div>
    </div>
  );
}
