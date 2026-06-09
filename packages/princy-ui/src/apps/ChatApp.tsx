import { useState, useCallback } from "react";
import { useVscodeBridge, useInitState } from "../hooks/useVscodeBridge.js";
import { ChatMessage } from "../components/ChatMessage.js";
import { GlowButton } from "../components/primitives.js";

type Msg = { role: "user" | "assistant" | "system"; content: string; thinking?: string; streaming?: boolean };
type Conv = { id: string; title: string };

const AGENTS = ["CODER", "ARCHITECT", "REVIEWER", "DEVOPS", "GENERAL"];

function ChatApp() {
  const init = useInitState();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [agentType, setAgentType] = useState("CODER");
  const [thinkingMode, setThinkingMode] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ type: string; label: string }>>([]);

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "init") {
      setConversations((msg.conversations as Conv[]) ?? []);
      setMessages((msg.messages as Msg[]) ?? []);
      if (msg.conversationId) setActiveId(msg.conversationId as string);
    }
    if (msg.type === "token") {
      setStreaming(true);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          return [...prev.slice(0, -1), { ...last, content: last.content + (msg.text as string) }];
        }
        return [...prev, { role: "assistant", content: msg.text as string, streaming: true }];
      });
    }
    if (msg.type === "thinking") {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [...prev.slice(0, -1), { ...last, thinking: msg.text as string }];
        }
        return prev;
      });
    }
    if (msg.type === "done") {
      setStreaming(false);
      setMessages((prev) => prev.map((m) => ({ ...m, streaming: false })));
      if (msg.conversationId) setActiveId(msg.conversationId as string);
    }
    if (msg.type === "cleared") {
      setMessages([]);
      setActiveId(undefined);
      setAttachments([]);
    }
    if (msg.type === "attachment") {
      setAttachments((prev) => [...prev, msg.attachment as { type: string; label: string }]);
    }
    if (msg.type === "conversations") setConversations(msg.conversations as Conv[]);
  }, []);

  const { post } = useVscodeBridge(onMessage);

  const send = () => {
    if (!input.trim() || streaming) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    post("send", { text: input, agentType, thinkingMode, conversationId: activeId, attachments });
    setInput("");
    setAttachments([]);
  };

  return (
    <div className={`chat-layout ${!init.motionEnabled ? "no-motion" : ""}`}>
      <aside className="chat-sidebar">
        <GlowButton onClick={() => post("newConversation")}>+ New</GlowButton>
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`conv-item ${c.id === activeId ? "active" : ""}`}
            onClick={() => post("selectConversation", { id: c.id })}
            style={{ padding: "6px 8px", cursor: "pointer", fontSize: 12, opacity: c.id === activeId ? 1 : 0.7 }}
          >
            {c.title || c.id.slice(0, 8)}
          </div>
        ))}
      </aside>
      <div className="chat-main">
        <header className="chat-header">
          <select value={agentType} onChange={(e) => setAgentType(e.target.value)}>
            {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <label style={{ fontSize: 12 }}>
            <input type="checkbox" checked={thinkingMode} onChange={(e) => setThinkingMode(e.target.checked)} /> Thinking
          </label>
          <GlowButton variant="ghost" onClick={() => post("attachFile")}>File</GlowButton>
          <GlowButton variant="ghost" onClick={() => post("attachSelection")}>Selection</GlowButton>
          <GlowButton variant="ghost" onClick={() => post("clear")}>Clear</GlowButton>
        </header>
        {attachments.length ? (
          <div className="toolbar">{attachments.map((a, i) => <span key={i} className="badge">{a.label}</span>)}</div>
        ) : null}
        <div className="chat-messages">
          {messages.length === 0 ? <div className="empty">Start a conversation with Princy AI</div> : null}
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} content={m.content} thinking={m.thinking} streaming={m.streaming} animations={init.chatAnimations} />
          ))}
        </div>
        <div className="chat-input-row">
          <textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} placeholder="Ask Princy..." />
          <GlowButton onClick={send} disabled={streaming}>Send</GlowButton>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;
