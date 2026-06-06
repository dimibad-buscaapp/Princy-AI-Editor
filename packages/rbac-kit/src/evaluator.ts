import { prisma } from "@princy/database";

export type RbacContext = {
  userId: string;
  orgId?: string;
  action: string;
  resource: string;
};

export async function evaluatePolicy(ctx: RbacContext): Promise<boolean> {
  const policies = ctx.orgId
    ? await prisma.$queryRaw<Array<{ effect: string; actions: unknown; resources: unknown }>>`
        SELECT effect, actions, resources FROM "Policy" WHERE "orgId" = ${ctx.orgId} OR "orgId" IS NULL
      `
    : await prisma.$queryRaw<Array<{ effect: string; actions: unknown; resources: unknown }>>`
        SELECT effect, actions, resources FROM "Policy" WHERE "orgId" IS NULL
      `;

  for (const p of policies) {
    const actions = Array.isArray(p.actions) ? (p.actions as string[]) : [];
    const resources = Array.isArray(p.resources) ? (p.resources as string[]) : [];
    const actionMatch = actions.includes("*") || actions.includes(ctx.action);
    const resourceMatch = resources.includes("*") || resources.some((r) => ctx.resource.startsWith(r));
    if (actionMatch && resourceMatch) {
      return p.effect !== "deny";
    }
  }
  return true;
}
