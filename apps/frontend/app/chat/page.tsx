"use client";

import { useState } from "react";
import { ProtectedRoute } from "../../src/components/auth/protected-route";
import { getAccessToken } from "../../src/lib/token-storage";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [thinking, setThinking] = useState(false);
  const [agentType, setAgentType] = useState("AUTO");

  async function send() {
    const token = getAccessToken();
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://127.0.0.1:3407";
    setResponse("");
    const res = await fetch(`${gateway}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ message, agentType, thinkingMode: thinking })
    });
    const reader = res.body?.getReader();
    if (!reader) {
      return;
    }
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      setResponse((prev) => prev + decoder.decode(value));
    }
  }

  return (
    <ProtectedRoute>
      <main className="chat-page">
        <h1>Chat Princy</h1>
        <div className="chat-controls">
          <select value={agentType} onChange={(e) => setAgentType(e.target.value)}>
            {["AUTO", "PLANNER", "CODER", "REVIEWER", "DEBUGGER", "ARCHITECT", "TERMINAL"].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <label>
            <input type="checkbox" checked={thinking} onChange={(e) => setThinking(e.target.checked)} />
            Thinking mode
          </label>
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
        <button type="button" onClick={send}>
          Enviar
        </button>
        <pre className="chat-response">{response}</pre>
      </main>
    </ProtectedRoute>
  );
}
