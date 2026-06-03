import { prisma } from "@princy/database";
import { eventBus } from "@princy/event-bus";

export class GoalEngine {
  async createGoal(input: { title: string; description?: string; projectId?: string; payload?: object }) {
    const goal = await prisma.autonomousGoal.create({
      data: {
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        payload: input.payload,
        status: "PENDING"
      }
    });
    eventBus.publish({ type: "task", name: "goal.created", payload: { goalId: goal.id } });
    return goal;
  }

  async updateStatus(goalId: string, status: "PLANNING" | "EXECUTING" | "AWAITING_APPROVAL" | "COMPLETED" | "FAILED") {
    return prisma.autonomousGoal.update({ where: { id: goalId }, data: { status } });
  }
}
