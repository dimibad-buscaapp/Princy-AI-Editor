import { eventBus } from "@princy/event-bus";
import { GoalEngine } from "./goal-engine.js";
import { ApprovalWorkflow } from "./approval-workflow.js";

const agentsUrl = process.env.AGENTS_URL ?? "http://127.0.0.1:3402";
const workspaceUrl = process.env.WORKSPACE_SERVICE_URL ?? "http://127.0.0.1:3403";

const AUTONOMOUS_STEPS = [
  "COORDINATOR",
  "ARCHITECT",
  "DEVELOPER",
  "TESTER",
  "REVIEWER",
  "DEVOPS"
] as const;

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
      payload: { objective, steps: [...AUTONOMOUS_STEPS] }
    });

    eventBus.publish({ type: "automation", name: "goal.planning", payload: { goalId: goal.id, phase: "PLANNING" } });
    await this.goals.updateStatus(goal.id, "PLANNING");

    let plan = "";
    let patchProposal: { summary?: string; diff?: string; review?: string } = {};
    try {
      const result = (await callAgents(
        "/agents/autonomous/run",
        { objective, context: projectId },
        authToken
      )) as {
        plan?: Record<string, string>;
        execution?: Record<string, string>;
        patchProposal?: { summary?: string; diff?: string; review?: string };
      };
      plan = JSON.stringify({ planning: result.plan, execution: result.execution }, null, 2);
      patchProposal = result.patchProposal ?? {};
    } catch {
      plan = `Plano gerado localmente para: ${objective}`;
    }

    eventBus.publish({ type: "automation", name: "goal.executing", payload: { goalId: goal.id, phase: "EXECUTING" } });
    await this.goals.updateStatus(goal.id, "EXECUTING");

    let diffPreview = {
      original: patchProposal.diff ? "// antes" : "// original",
      modified: patchProposal.diff ?? `// ${objective}\n// patch proposto`
    };
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
          diff: patchProposal.diff ?? `+// Autonomous: ${objective}\n`
        })
      });
      if (previewRes.ok) {
        const data = (await previewRes.json()) as { preview: typeof diffPreview };
        diffPreview = data.preview;
      }
    } catch {
      /* preview optional */
    }

    eventBus.publish({
      type: "automation",
      name: "goal.awaiting_approval",
      payload: { goalId: goal.id, phase: "AWAITING_APPROVAL", review: patchProposal.review }
    });
    await this.goals.updateStatus(goal.id, "AWAITING_APPROVAL");

    const approval = await this.approvals.request({
      goalId: goal.id,
      type: "full_autonomy",
      metadata: { objective, plan, diff: diffPreview, review: patchProposal.review, steps: AUTONOMOUS_STEPS }
    });
    return { goal, approval };
  }

  async complete(goalId: string, approvalId: string, authToken?: string) {
    await this.approvals.approve(approvalId);
    eventBus.publish({ type: "automation", name: "goal.completed", payload: { goalId, phase: "COMPLETED" } });
    try {
      await fetch(`${workspaceUrl}/patch/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ projectId: "demo", filePath: "src/autonomous.generated.ts" })
      });
    } catch {
      /* apply best-effort */
    }
    return this.goals.updateStatus(goalId, "COMPLETED");
  }
}
