import { eventBus } from "@princy/event-bus";
import { ArchitectAgent } from "../agents/architect.agent.js";
import { CoderAgent } from "../agents/coder.agent.js";
import { PlannerAgent } from "../agents/planner.agent.js";
import { ReviewerAgent } from "../agents/reviewer.agent.js";
import { AgentExecutionEngine } from "./agent-execution-engine.js";

export class AgentCoordinator {
  private readonly engine = new AgentExecutionEngine();

  async runPipeline(objective: string, context?: string) {
    const planner = new PlannerAgent();
    const architect = new ArchitectAgent();
    const coder = new CoderAgent();
    const reviewer = new ReviewerAgent();

    eventBus.publish({ type: "agent", name: "pipeline.started", payload: { objective } });

    const plan = await this.engine.execute(planner, { objective, context });
    const architecture = await this.engine.execute(architect, { objective, context, previousOutput: plan.output });
    const code = await this.engine.execute(coder, {
      objective,
      context: `${context ?? ""}\n${architecture.output}`,
      previousOutput: plan.output
    });
    const review = await this.engine.execute(reviewer, { objective, previousOutput: code.output });

    const patchProposal = {
      summary: review.output,
      diff: code.output,
      plan: plan.output
    };

    eventBus.publish({ type: "agent", name: "pipeline.completed", payload: { patchProposal } });

    return {
      plan: plan.output,
      architecture: architecture.output,
      code: code.output,
      review: review.output,
      output: review.output,
      patchProposal
    };
  }
}
