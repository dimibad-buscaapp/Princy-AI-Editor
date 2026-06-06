#!/usr/bin/env node
const base = (process.env.OLLAMA_BASE_URL ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
const model = process.env.CHAT_FAST_MODEL ?? process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5:3b";

const res = await fetch(`${base}/api/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model,
    prompt: "ping",
    stream: false,
    keep_alive: process.env.OLLAMA_KEEP_ALIVE ?? "10m",
    options: { num_predict: 1, num_ctx: 512 }
  })
});

if (!res.ok) {
  console.error(`warm-ollama failed (${res.status}) for model ${model}`);
  process.exit(1);
}

console.log(`warm-ollama OK: ${model}`);
process.exit(0);
