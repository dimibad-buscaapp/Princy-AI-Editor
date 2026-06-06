import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";

export class MemoryAgent extends BaseAgent {
  readonly type = "PLANNER" as const;
  readonly swarmRole = "MEMORY" as const;

  protected defaultIntent() {
    return "chat" as const;
  }

  async run(ctx: AgentContext): Promise<AgentResult> {
    const memoryUrl = process.env.MEMORY_SERVICE_URL ?? "http://127.0.0.1:3405";
    let results: unknown[] = [];
    let usage: unknown = null;
    try {
      const [searchRes, usageRes] = await Promise.all([
        fetch(`${memoryUrl}/memory/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: ctx.objective, limit: 8, mode: "hybrid" })
        }),
        fetch(`${memoryUrl}/memory/usage`, { headers: { "Content-Type": "application/json" } })
      ]);
      if (searchRes.ok) {
        const data = (await searchRes.json()) as { results?: unknown[] };
        results = data.results ?? [];
      }
      if (usageRes.ok) usage = await usageRes.json();
    } catch {
      /* optional */
    }
    const output = await this.prompt(
      "You are the Memory Agent. Summarize relevant memories and RAG context for the swarm.",
      `Objective: ${ctx.objective}\nResults: ${JSON.stringify(results).slice(0, 4000)}\nUsage: ${JSON.stringify(usage)}`
    );
    return { output, metadata: { kind: "memory", hits: results.length } };
  }
}
