import { HttpError } from "@princy/core";
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

  async linkLocal(userId: string, localPath: string, projectId?: string) {
    let pid = projectId;
    if (!pid) {
      let project = await prisma.project.findFirst({
        where: { ownerId: userId, name: "VS Code" },
        orderBy: { updatedAt: "desc" }
      });
      if (!project) {
        project = await prisma.project.create({
          data: { name: "VS Code", description: "Linked from Princy VS Code extension", ownerId: userId }
        });
      }
      pid = project.id;
    } else {
      const ok = await this.assertProjectAccess(pid, userId);
      if (!ok) {
        throw new HttpError(403, "forbidden", "Project access denied.");
      }
    }

    const normalized = localPath.replace(/\\/g, "/");
    const existing = await prisma.workspace.findFirst({
      where: { projectId: pid, path: normalized }
    });
    if (existing) {
      return prisma.workspace.update({
        where: { id: existing.id },
        data: { path: normalized },
        include: { project: true }
      });
    }
    return prisma.workspace.create({
      data: { projectId: pid, path: normalized },
      include: { project: true }
    });
  }
}
