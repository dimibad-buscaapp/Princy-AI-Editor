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

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (message: string, agentType: string, thinkingMode: boolean) => {
    const token = getAccessToken();
    const userId = generateId();
    const assistantId = generateId();
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

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
        body: JSON.stringify({ message, agentType, thinkingMode })
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
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, thinking: event.content } : m)));
          }
          if (event.type === "token") {
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.content } : m)));
          }
          if (event.type === "error") setError(event.message);
          if (event.type === "done" && !event.ok) setError((e) => e ?? "Chat encerrado com erro");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no chat");
    } finally {
      setStreaming(false);
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)));
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setStatus("");
    setError(null);
  }, []);

  return { messages, status, streaming, error, send, clear, setMessages };
}
