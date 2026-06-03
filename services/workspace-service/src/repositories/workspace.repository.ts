import { prisma } from "@princy/database";

export class WorkspaceRepository {
  async findById(id: string) {
    return prisma.workspace.findUnique({ where: { id }, include: { project: true } });
  }

  async findByProject(projectId: string) {
    return prisma.workspace.findMany({ where: { projectId } });
  }

  async assertProjectAccess(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
    return Boolean(project);
  }
}
