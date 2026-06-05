export type ChatSseEvent =
  | { type: "status"; message: string }
  | { type: "thinking"; content: string }
  | { type: "token"; content: string }
  | { type: "error"; message: string }
  | { type: "done"; ok: boolean };

export function parseSseChunk(buffer: string): { events: ChatSseEvent[]; rest: string } {
  const events: ChatSseEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim()) continue;
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
      else if (eventType === "done") events.push({ type: "done", ok: Boolean(parsed.ok) });
    } catch {
      // ignore malformed
    }
  }

  return { events, rest };
}
