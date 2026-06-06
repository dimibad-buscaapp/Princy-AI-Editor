import { rawGetProjectMemory, rawUpsertProjectMemory } from "./raw-db.js";

export type ProjectMemoryData = {
  name?: string;
  stack?: unknown;
  services?: unknown;
  ports?: unknown;
  routes?: unknown;
  recentChanges?: unknown;
  pending?: unknown;
  technicalDecisions?: unknown;
};

export async function getProjectMemory(projectId: string) {
  return rawGetProjectMemory(projectId);
}

export async function upsertProjectMemory(projectId: string, data: ProjectMemoryData) {
  return rawUpsertProjectMemory(projectId, data as Record<string, unknown>);
}

export function formatProjectMemorySlice(memory: ProjectMemoryData | null): string {
  if (!memory) return "";
  const parts: string[] = [];
  if (memory.name) parts.push(`Project: ${memory.name}`);
  if (memory.stack) parts.push(`Stack: ${JSON.stringify(memory.stack)}`);
  if (memory.services) parts.push(`Services: ${JSON.stringify(memory.services)}`);
  if (memory.ports) parts.push(`Ports: ${JSON.stringify(memory.ports)}`);
  if (memory.pending) parts.push(`Pending: ${JSON.stringify(memory.pending)}`);
  if (memory.technicalDecisions) parts.push(`Decisions: ${JSON.stringify(memory.technicalDecisions)}`);
  return parts.join("\n").slice(0, 2000);
}
