import type { AuthService } from "../../auth.js";
import { getPrincyClient, withClient } from "../../princyClient.js";
import * as vscode from "vscode";

const SWARM_DISPLAY_NAMES: Record<string, string> = {
  ARCHITECT: "Architect",
  REVIEWER: "Reviewer",
  DEVELOPER: "Developer",
  RESEARCHER: "Researcher",
  TESTER: "Tester",
  WRITER: "Writer",
  DEVOPS: "DevOps",
  COORDINATOR: "Coordinator",
  CODER: "Coder"
};

export type SwarmStreamCallbacks = {
  onAgents: (agents: unknown[]) => void;
  onActivity: (entry: { time: string; message: string }) => void;
  onThinking: (thinking: Record<string, unknown>) => void;
};

export class SwarmStreamService {
  private pollTimer?: ReturnType<typeof setInterval>;
  private sseAbort?: AbortController;
  private activity: Array<{ time: string; message: string }> = [];

  constructor(private readonly auth: AuthService) {}

  start(callbacks: SwarmStreamCallbacks): void {
    this.stop();
    void this.poll(callbacks);

    const live = vscode.workspace.getConfiguration("princy").get<boolean>("swarmLiveUpdates", true);
    if (live) void this.connectSse(callbacks);

    this.pollTimer = setInterval(() => void this.poll(callbacks), live ? 15_000 : 10_000);
  }

  stop(): void {
    this.sseAbort?.abort();
    this.sseAbort = undefined;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = undefined;
  }

  private async connectSse(callbacks: SwarmStreamCallbacks): Promise<void> {
    const token = await this.auth.getToken();
    const client = getPrincyClient(this.auth);
    const url = client.eventsStreamUrl();
    this.sseAbort = new AbortController();

    try {
      const headers: Record<string, string> = { Accept: "text/event-stream" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(url, { headers, signal: this.sseAbort.signal });
      if (!response.ok || !response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const dataLine = part.split("\n").find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine.slice(5).trim()) as { type?: string; message?: string };
            const type = data.type ?? "";
            if (type.includes("neural") || type.includes("swarm") || type.includes("run")) {
              const entry = { time: new Date().toLocaleTimeString(), message: data.message ?? type };
              this.activity = [entry, ...this.activity].slice(0, 50);
              callbacks.onActivity(entry);
              void this.poll(callbacks);
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* SSE fallback to poll only */
    }
  }

  private async poll(callbacks: SwarmStreamCallbacks): Promise<void> {
    await withClient(this.auth, async (client) => {
      const [status, metrics] = await Promise.all([
        client.agentsStatus(),
        client.agentsMetrics()
      ]);
      const agents = ((status.agents as Array<Record<string, unknown>>) ?? []).map((a) => ({
        name: SWARM_DISPLAY_NAMES[String(a.type ?? a.role ?? "")] ?? String(a.type ?? a.role ?? "Agent"),
        role: String(a.type ?? a.role ?? "AGENT"),
        model: String(a.model ?? "Neural Router"),
        latencyMs: typeof a.latencyMs === "number" ? a.latencyMs : undefined,
        status: String(a.status ?? "idle"),
        artifacts: Array.isArray(a.artifacts) ? (a.artifacts as string[]) : undefined
      }));
      callbacks.onAgents(agents);
      callbacks.onThinking({
        objective: metrics.objective as string | undefined,
        plan: metrics.plan as string | undefined,
        steps: metrics.steps as unknown
      });
      if (this.activity.length) {
        for (const a of this.activity.slice(0, 5)) callbacks.onActivity(a);
      }
    });
  }
}
