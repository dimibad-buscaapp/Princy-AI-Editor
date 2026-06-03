import { prisma } from "@princy/database";

export class ApprovalWorkflow {
  async request(input: { goalId?: string; patchId?: string; type: string; metadata?: object }) {
    return prisma.approvalRequest.create({
      data: {
        goalId: input.goalId,
        patchId: input.patchId,
        type: input.type,
        metadata: input.metadata,
        status: "PENDING"
      }
    });
  }

  async approve(id: string) {
    return prisma.approvalRequest.update({ where: { id }, data: { status: "APPROVED" } });
  }

  async reject(id: string) {
    return prisma.approvalRequest.update({ where: { id }, data: { status: "REJECTED" } });
  }
}
