import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";

export class ContextGraphAgent extends BaseAgent {
  readonly type = "ARCHITECT" as const;
  readonly swarmRole = "CONTEXT_GRAPH" as const;

  protected defaultIntent() {
    return "plan" as const;
  }

  async run(ctx: AgentContext): Promise<AgentResult> {
    const graphUrl = process.env.CONTEXT_GRAPH_URL ?? "http://127.0.0.1:3404";
    let nodes: unknown[] = [];
    try {
      const res = await fetch(`${graphUrl}/context/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: ctx.objective })
      });
      if (res.ok) {
        const data = (await res.json()) as { nodes?: unknown[] };
        nodes = data.nodes ?? [];
      }
    } catch {
      /* optional */
    }
    const output = await this.prompt(
      "You are the Context Graph Agent. Map dependencies, symbols, and impact areas.",
      `Objective: ${ctx.objective}\nSymbols: ${JSON.stringify(nodes).slice(0, 4000)}\nContext: ${ctx.context ?? ""}`
    );
    return { output, metadata: { kind: "context_graph", nodes: nodes.length } };
  }
}
