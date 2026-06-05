"use client";

import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { useToast } from "../../design-system/Toast";
import type { ChatMessage as ChatMessageType } from "./use-chat-stream";

export function ChatMessage({ message }: { message: ChatMessageType & { time?: string } }) {
  const isUser = message.role === "user";
  const toast = useToast();

  async function copyContent() {
    await navigator.clipboard.writeText(message.content);
    toast.show("Copiado!");
  }

  function soon() {
    toast.show("Em breve");
  }

  return (
    <div className={`chat-msg ${isUser ? "chat-msg--user" : "chat-msg--assistant"}`}>
      {!isUser ? (
        <Image src="/princy/chat-avatar.png" alt="Princy" width={36} height={36} className="chat-msg__avatar" />
      ) : null}
      <div className="chat-msg__bubble">
        {message.thinking ? <p className="chat-msg__thinking">{message.thinking}</p> : null}
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || (message.streaming ? "..." : "")}</ReactMarkdown>
        )}
        {!isUser && !message.streaming ? (
          <footer className="chat-msg__footer">
            <span>Princy IA • {message.time ?? new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            <div className="chat-msg__actions">
              <button type="button" onClick={() => void copyContent()} aria-label="Copiar"><Copy size={14} /></button>
              <button type="button" onClick={soon} aria-label="Regenerar"><RefreshCw size={14} /></button>
              <button type="button" onClick={soon} aria-label="Positivo"><ThumbsUp size={14} /></button>
              <button type="button" onClick={soon} aria-label="Negativo"><ThumbsDown size={14} /></button>
              <button type="button" onClick={soon} aria-label="Confirmar"><Check size={14} /></button>
            </div>
          </footer>
        ) : null}
        {message.streaming ? <span className="chat-msg__cursor" aria-hidden /> : null}
      </div>
    </div>
  );
}
