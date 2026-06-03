import { prisma, type Prisma } from "@princy/database";

export class ContextNodeRepository {
  async upsertNode(data: {
    projectId?: string;
    type: string;
    name: string;
    path?: string;
    metadata?: Record<string, unknown>;
  }) {
    const existing = await prisma.contextNode.findFirst({
      where: {
        projectId: data.projectId ?? null,
        type: data.type,
        name: data.name,
        path: data.path ?? null
      }
    });
    if (existing) {
      return prisma.contextNode.update({
        where: { id: existing.id },
        data: { metadata: data.metadata as Prisma.InputJsonValue | undefined }
      });
    }
    return prisma.contextNode.create({
      data: {
        projectId: data.projectId,
        type: data.type,
        name: data.name,
        path: data.path,
        metadata: data.metadata as Prisma.InputJsonValue | undefined
      }
    });
  }

  async search(projectId: string | undefined, query: string, limit = 50) {
    return prisma.contextNode.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { path: { contains: query, mode: "insensitive" } }
        ]
      },
      take: limit
    });
  }

  async findByPath(projectId: string | undefined, filePath: string) {
    return prisma.contextNode.findMany({
      where: { projectId: projectId ?? undefined, path: filePath },
      include: {
        outgoingEdges: { include: { target: true } },
        incomingEdges: { include: { source: true } }
      }
    });
  }

  async listGraph(projectId: string | undefined, limit = 200) {
    const nodes = await prisma.contextNode.findMany({
      where: projectId ? { projectId } : {},
      take: limit
    });
    const nodeIds = nodes.map((n) => n.id);
    const edges = await prisma.contextEdge.findMany({
      where: { sourceId: { in: nodeIds } },
      take: Number(process.env.CONTEXT_GRAPH_MAX_EDGES ?? 50000)
    });
    return { nodes, edges };
  }
}

export class ContextEdgeRepository {
  async upsertEdge(data: {
    sourceId: string;
    targetId: string;
    relationship: string;
    metadata?: Record<string, unknown>;
  }) {
    const existing = await prisma.contextEdge.findFirst({
      where: {
        sourceId: data.sourceId,
        targetId: data.targetId,
        relationship: data.relationship
      }
    });
    if (existing) {
      return existing;
    }
    return prisma.contextEdge.create({
      data: {
        sourceId: data.sourceId,
        targetId: data.targetId,
        relationship: data.relationship,
        metadata: data.metadata as Prisma.InputJsonValue | undefined
      }
    });
  }
}
