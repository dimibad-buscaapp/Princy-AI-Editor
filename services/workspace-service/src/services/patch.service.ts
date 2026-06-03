import fs from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@princy/core";
import { prisma } from "@princy/database";
import { eventBus } from "@princy/event-bus";
import { resolveSafePath } from "../workspace/workspace-guard.js";

export class PatchService {
  async create(input: {
    projectId: string;
    workspaceId?: string;
    createdById?: string;
    filePath: string;
    diff: string;
    workspaceRoot: string;
  }) {
    const patch = await prisma.patch.create({
      data: {
        projectId: input.projectId,
        workspaceId: input.workspaceId,
        createdById: input.createdById,
        filePath: input.filePath,
        diff: input.diff,
        status: "PROPOSED"
      }
    });
    await prisma.patchHistory.create({
      data: { patchId: patch.id, action: "created" }
    });
    eventBus.publish({ type: "patch", name: "created", payload: { patchId: patch.id } });
    return patch;
  }

  async apply(patchId: string, workspaceRoot: string) {
    const patch = await prisma.patch.findUnique({ where: { id: patchId } });
    if (!patch) {
      throw new HttpError(404, "not_found", "Patch not found.");
    }
    const target = resolveSafePath(workspaceRoot, patch.filePath);
    const original = await fs.readFile(target, "utf8").catch(() => "");
    const backupPath = `${target}.bak-${Date.now()}`;
    await fs.writeFile(backupPath, original, "utf8");

    const updated = applyUnifiedDiff(original, patch.diff);
    await fs.writeFile(target, updated, "utf8");

    const updatedPatch = await prisma.patch.update({
      where: { id: patchId },
      data: { status: "APPLIED", backupPath, appliedAt: new Date() }
    });
    await prisma.patchHistory.create({
      data: { patchId, action: "applied", metadata: { backupPath } }
    });
    eventBus.publish({ type: "patch", name: "applied", payload: { patchId } });
    return updatedPatch;
  }

  async rollback(patchId: string) {
    const patch = await prisma.patch.findUnique({ where: { id: patchId } });
    if (!patch?.backupPath) {
      throw new HttpError(400, "invalid_state", "No backup available.");
    }
    const workspace = patch.workspaceId
      ? await prisma.workspace.findUnique({ where: { id: patch.workspaceId } })
      : null;
    if (!workspace) {
      throw new HttpError(400, "invalid_state", "Workspace required for rollback.");
    }
    const target = resolveSafePath(workspace.path, patch.filePath);
    const backup = await fs.readFile(patch.backupPath, "utf8");
    await fs.writeFile(target, backup, "utf8");
    const updated = await prisma.patch.update({
      where: { id: patchId },
      data: { status: "ROLLED_BACK" }
    });
    await prisma.patchHistory.create({ data: { patchId, action: "rolled_back" } });
    return updated;
  }

  async history(patchId?: string) {
    return prisma.patchHistory.findMany({
      where: patchId ? { patchId } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { patch: true }
    });
  }
}

function applyUnifiedDiff(original: string, diff: string) {
  if (diff.includes("@@")) {
    const lines = diff.split("\n");
    const result = original.split("\n");
    for (const line of lines) {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        result.push(line.slice(1));
      }
    }
    return result.join("\n");
  }
  return diff;
}
