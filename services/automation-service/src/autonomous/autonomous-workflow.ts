import { eventBus } from "@princy/event-bus";
import { GoalEngine } from "./goal-engine.js";
import { ApprovalWorkflow } from "./approval-workflow.js";

const agentsUrl = process.env.AGENTS_URL ?? "http://127.0.0.1:3402";
const workspaceUrl = process.env.WORKSPACE_SERVICE_URL ?? "http://127.0.0.1:3403";

async function callAgents(path: string, body: unknown, token?: string) {
  const res = await fetch(`${agentsUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`agents ${path} failed: ${res.status}`);
  }
  return res.json();
}

export class AutonomousWorkflow {
  constructor(
    private readonly goals = new GoalEngine(),
    private readonly approvals = new ApprovalWorkflow()
  ) {}

  async start(objective: string, projectId?: string, authToken?: string) {
    const goal = await this.goals.createGoal({
      title: objective,
      projectId,
      payload: { objective }
    });

    eventBus.publish({ type: "automation", name: "goal.planning", payload: { goalId: goal.id } });
    await this.goals.updateStatus(goal.id, "PLANNING");

    let plan = "";
    try {
      const swarm = (await callAgents("/agents/swarm/run", { objective, projectId }, authToken)) as {
        steps?: unknown;
      };
      plan = JSON.stringify(swarm.steps ?? swarm, null, 2);
    } catch {
      plan = `Plano gerado localmente para: ${objective}`;
    }

    eventBus.publish({ type: "automation", name: "goal.executing", payload: { goalId: goal.id } });
    await this.goals.updateStatus(goal.id, "EXECUTING");

    let diffPreview = { original: "// original", modified: `// ${objective}\n// patch proposto` };
    try {
      const previewRes = await fetch(`${workspaceUrl}/patch/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          projectId: projectId ?? "demo",
          filePath: "src/autonomous.generated.ts",
          diff: `+// Autonomous: ${objective}\n`
        })
      });
      if (previewRes.ok) {
        const data = (await previewRes.json()) as { preview: typeof diffPreview };
        diffPreview = data.preview;
      }
    } catch {
      /* preview optional */
    }

    eventBus.publish({ type: "automation", name: "goal.awaiting_approval", payload: { goalId: goal.id } });
    await this.goals.updateStatus(goal.id, "AWAITING_APPROVAL");

    const approval = await this.approvals.request({
      goalId: goal.id,
      type: "full_autonomy",
      metadata: { objective, plan, diff: diffPreview }
    });
    return { goal, approval };
  }

  async complete(goalId: string, approvalId: string) {
    await this.approvals.approve(approvalId);
    eventBus.publish({ type: "automation", name: "goal.completed", payload: { goalId } });
    return this.goals.updateStatus(goalId, "COMPLETED");
  }
}
