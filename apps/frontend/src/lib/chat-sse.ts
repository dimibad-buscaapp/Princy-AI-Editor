export type ChatSseEvent =
  | { type: "status"; message: string }
  | { type: "thinking"; content: string }
  | { type: "token"; content: string }
  | { type: "error"; message: string }
  | {
      type: "done";
      ok: boolean;
      conversationId?: string;
      model?: string;
      cacheHit?: boolean;
      metrics?: {
        ttftMs: number;
        totalMs: number;
        tokensPerSec: number;
        cacheHit?: boolean;
        ragChunks?: number;
        historyMessages?: number;
      };
    };

export function parseSseChunk(buffer: string): { events: ChatSseEvent[]; rest: string } {
  const events: ChatSseEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim() || part.trim().startsWith(":")) continue;
    let eventType = "message";
    let data = "";
    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) eventType = line.slice(6).trim();
      if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (!data) continue;
    try {
      const parsed = JSON.parse(data) as Record<string, unknown>;
      if (eventType === "status") events.push({ type: "status", message: String(parsed.message ?? "") });
      else if (eventType === "thinking") events.push({ type: "thinking", content: String(parsed.content ?? "") });
      else if (eventType === "token") events.push({ type: "token", content: String(parsed.content ?? "") });
      else if (eventType === "error") events.push({ type: "error", message: String(parsed.message ?? "") });
      else if (eventType === "done") {
        const metrics = parsed.metrics as Record<string, unknown> | undefined;
        events.push({
          type: "done",
          ok: Boolean(parsed.ok),
          conversationId: parsed.conversationId ? String(parsed.conversationId) : undefined,
          model: parsed.model ? String(parsed.model) : undefined,
          cacheHit: Boolean(parsed.cacheHit),
          metrics: metrics
            ? {
                ttftMs: Number(metrics.ttftMs ?? 0),
                totalMs: Number(metrics.totalMs ?? 0),
                tokensPerSec: Number(metrics.tokensPerSec ?? 0),
                cacheHit: Boolean(metrics.cacheHit),
                ragChunks: metrics.ragChunks !== undefined ? Number(metrics.ragChunks) : undefined,
                historyMessages: metrics.historyMessages !== undefined ? Number(metrics.historyMessages) : undefined
              }
            : undefined
        });
      }
    } catch {
      // ignore malformed
    }
  }

  return { events, rest };
}
