import { prisma } from "@princy/database";

export type TaskCategory =
  | "build_fix"
  | "test"
  | "refactor"
  | "deploy"
  | "bugfix"
  | "feature"
  | "general";

const CATEGORY_RULES: Array<{ category: TaskCategory; patterns: RegExp[]; label: string }> = [
  { category: "build_fix", label: "Corrigir build", patterns: [/build|compile|bundl|webpack|vite|tsc/i, /corr?igir.*build/i] },
  { category: "test", label: "Testes", patterns: [/test|jest|vitest|cypress|coverage/i] },
  { category: "refactor", label: "Refatoração", patterns: [/refactor|reorganiz|clean.?up|simplif/i] },
  { category: "deploy", label: "Deploy", patterns: [/deploy|release|devops|docker|pm2/i] },
  { category: "bugfix", label: "Correção de bug", patterns: [/bug|fix|erro|falha|crash/i] },
  { category: "feature", label: "Nova feature", patterns: [/implement|adicionar|criar|feature|novo/i] }
];

function cuid() {
  return `tp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function classifyTaskObjective(objective: string): { category: TaskCategory; label: string; patternKey: string } {
  const text = objective.toLowerCase().trim();
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      const patternKey = `${rule.category}:${text.replace(/\s+/g, " ").slice(0, 60)}`;
      return { category: rule.category, label: rule.label, patternKey };
    }
  }
  const patternKey = `general:${text.replace(/\s+/g, " ").slice(0, 60)}`;
  return { category: "general", label: "Tarefa geral", patternKey };
}

function defaultTemplate(category: TaskCategory) {
  const base = ["COORDINATOR", "ARCHITECT", "DEVELOPER", "TESTER", "REVIEWER", "DEVOPS"];
  switch (category) {
    case "build_fix":
      return { steps: base, focus: "Diagnóstico de build, correção e validação" };
    case "test":
      return { steps: ["COORDINATOR", "DEVELOPER", "TESTER", "REVIEWER"], focus: "Gerar e executar testes" };
    case "deploy":
      return { steps: ["COORDINATOR", "REVIEWER", "DEVOPS"], focus: "Plano de deploy seguro" };
    case "refactor":
      return { steps: ["COORDINATOR", "ARCHITECT", "DEVELOPER", "TESTER", "REVIEWER"], focus: "Refatorar sem quebrar contratos" };
    default:
      return { steps: base, focus: "Pipeline padrão Princy" };
  }
}

export async function recordTaskPattern(input: {
  objective: string;
  projectId?: string;
  planSnapshot?: unknown;
}) {
  const { category, label, patternKey } = classifyTaskObjective(input.objective);
  const normalizedKey = patternKey.slice(0, 120);

  const existing = await prisma.$queryRaw<Array<{ id: string; occurrenceCount: number }>>`
    SELECT id, "occurrenceCount" FROM "TaskPattern" WHERE "patternKey" = ${normalizedKey} LIMIT 1
  `;
  const row = existing[0];

  if (row) {
    await prisma.$executeRaw`
      UPDATE "TaskPattern" SET
        "occurrenceCount" = ${row.occurrenceCount + 1},
        "lastPlan" = COALESCE(${input.planSnapshot ? JSON.stringify(input.planSnapshot) : null}::jsonb, "lastPlan"),
        "updatedAt" = NOW()
      WHERE id = ${row.id}
    `;
    return { id: row.id, category, occurrenceCount: row.occurrenceCount + 1, isNew: false };
  }

  const id = cuid();
  const template = defaultTemplate(category);
  await prisma.$executeRaw`
    INSERT INTO "TaskPattern" (id, "patternKey", label, category, "occurrenceCount", template, "lastPlan", "projectId", "createdAt", "updatedAt")
    VALUES (${id}, ${normalizedKey}, ${label}, ${category}, 1, ${JSON.stringify(template)}::jsonb,
      ${input.planSnapshot ? JSON.stringify(input.planSnapshot) : null}::jsonb,
      ${input.projectId ?? null}, NOW(), NOW())
  `;
  return { id, category, occurrenceCount: 1, isNew: true };
}

export async function listTaskPatterns(options?: { projectId?: string; limit?: number }) {
  const limit = options?.limit ?? 50;
  if (options?.projectId) {
    return prisma.$queryRaw`
      SELECT * FROM "TaskPattern" WHERE "projectId" = ${options.projectId}
      ORDER BY "occurrenceCount" DESC, "updatedAt" DESC LIMIT ${limit}
    `;
  }
  return prisma.$queryRaw`
    SELECT * FROM "TaskPattern" ORDER BY "occurrenceCount" DESC, "updatedAt" DESC LIMIT ${limit}
  `;
}

export async function getAutomationSuggestions(minOccurrences = 3) {
  const patterns = await prisma.$queryRaw<
    Array<{ id: string; label: string; category: string; occurrenceCount: number; template: unknown; patternKey: string }>
  >`
    SELECT id, label, category, "occurrenceCount", template, "patternKey"
    FROM "TaskPattern" WHERE "occurrenceCount" >= ${minOccurrences}
    ORDER BY "occurrenceCount" DESC LIMIT 20
  `;

  return patterns.map((p) => ({
    id: p.id,
    label: p.label,
    category: p.category,
    occurrenceCount: p.occurrenceCount,
    patternKey: p.patternKey,
    template: p.template,
    suggestion: `Fluxo padrão para "${p.label}" (${p.occurrenceCount}x) — considere automação.`
  }));
}

export async function classifyAndSuggest(objective: string, projectId?: string) {
  const classified = classifyTaskObjective(objective);
  const patterns = await prisma.$queryRaw<
    Array<{ id: string; template: unknown; lastPlan: unknown; occurrenceCount: number }>
  >`
    SELECT id, template, "lastPlan", "occurrenceCount" FROM "TaskPattern"
    WHERE category = ${classified.category}
    ORDER BY "occurrenceCount" DESC LIMIT 3
  `;

  const match = patterns[0];
  return {
    classification: classified,
    reusedPlan: match?.lastPlan ?? null,
    template: match?.template ?? defaultTemplate(classified.category),
    suggestAutomation: (match?.occurrenceCount ?? 0) >= 3
  };
}
