"use client";

import { useCallback, useState } from "react";
import { parseSseChunk } from "../../lib/chat-sse";
import { apiUrl } from "../../lib/api";
import { generateId } from "../../lib/generate-id";
import { getAccessToken } from "../../lib/token-storage";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  streaming?: boolean;
  time?: string;
};

type SendOptions = {
  conversationId?: string;
  model?: string;
};

export type ChatMetrics = {
  model?: string;
  ttftMs?: number;
  totalMs?: number;
  tokensPerSec?: number;
  cacheHit?: boolean;
  ragChunks?: number;
  historyMessages?: number;
};

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [chatMetrics, setChatMetrics] = useState<ChatMetrics | null>(null);

  const send = useCallback(
    async (message: string, agentType: string, thinkingMode: boolean, options?: SendOptions) => {
      const token = getAccessToken();
      const userId = generateId();
      const assistantId = generateId();
      const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const activeConversationId = options?.conversationId ?? conversationId;

      setError(null);
      setStatus("");
      setStreaming(true);
      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", content: message, time: now },
        { id: assistantId, role: "assistant", content: "", streaming: true, time: now }
      ]);

      try {
        const res = await fetch(apiUrl("/chat/stream"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            message,
            agentType,
            thinkingMode,
            conversationId: activeConversationId,
            model: options?.model
          })
        });

        if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const { events, rest } = parseSseChunk(buffer);
          buffer = rest;

          for (const event of events) {
            if (event.type === "status") setStatus(event.message);
            if (event.type === "thinking") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, thinking: (m.thinking ?? "") + event.content } : m
                )
              );
            }
            if (event.type === "token") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + event.content, thinking: undefined } : m
                )
              );
            }
            if (event.type === "error") setError(event.message);
            if (event.type === "done") {
              if (!event.ok) setError((e) => e ?? "Chat encerrado com erro");
              if (event.conversationId) setConversationId(event.conversationId);
              setChatMetrics({
                model: event.model,
                ttftMs: event.metrics?.ttftMs,
                totalMs: event.metrics?.totalMs,
                tokensPerSec: event.metrics?.tokensPerSec,
                cacheHit: event.cacheHit ?? event.metrics?.cacheHit,
                ragChunks: event.metrics?.ragChunks,
                historyMessages: event.metrics?.historyMessages
              });
            }
          }
        }
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err);
        const interrupted =
          raw.includes("ERR_INCOMPLETE_CHUNKED_ENCODING") ||
          raw.toLowerCase().includes("network error") ||
          raw.toLowerCase().includes("failed to fetch");
        setError(interrupted ? "Conexão interrompida. Tente novamente." : raw || "Erro no chat");
      } finally {
        setStreaming(false);
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)));
      }
    },
    [conversationId]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setStatus("");
    setError(null);
    setConversationId(undefined);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const token = getAccessToken();
    const res = await fetch(apiUrl(`/chat/conversations/${id}/messages`), {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Falha ao carregar conversa");
    const data = (await res.json()) as { messages: ChatMessage[] };
    setConversationId(id);
    setMessages(data.messages.map((m) => ({ ...m, streaming: false })));
    setError(null);
  }, []);

  return { messages, status, streaming, error, conversationId, chatMetrics, send, clear, setMessages, loadConversation };
}
