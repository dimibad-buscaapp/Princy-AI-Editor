import { GoalEngine } from "./goal-engine.js";
import { ApprovalWorkflow } from "./approval-workflow.js";

export class AutonomousWorkflow {
  constructor(
    private readonly goals = new GoalEngine(),
    private readonly approvals = new ApprovalWorkflow()
  ) {}

  async start(objective: string, projectId?: string) {
    const goal = await this.goals.createGoal({
      title: objective,
      projectId,
      payload: { objective }
    });
    await this.goals.updateStatus(goal.id, "PLANNING");
    await this.goals.updateStatus(goal.id, "EXECUTING");
    await this.goals.updateStatus(goal.id, "AWAITING_APPROVAL");
    const approval = await this.approvals.request({
      goalId: goal.id,
      type: "full_autonomy",
      metadata: { objective }
    });
    return { goal, approval };
  }

  async complete(goalId: string, approvalId: string) {
    await this.approvals.approve(approvalId);
    return this.goals.updateStatus(goalId, "COMPLETED");
  }
}
