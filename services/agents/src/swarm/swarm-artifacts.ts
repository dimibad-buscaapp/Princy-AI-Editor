export type SwarmAgentRole =
  | "COORDINATOR"
  | "ARCHITECT"
  | "DEVELOPER"
  | "TESTER"
  | "REVIEWER"
  | "DEVOPS";

export type SwarmArtifactType =
  | "plan"
  | "subtasks"
  | "files"
  | "patch"
  | "tests"
  | "report"
  | "deploy_plan";

export type SwarmArtifact = {
  type: SwarmArtifactType;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
};

export type SwarmTaskOutput = {
  text: string;
  artifacts: SwarmArtifact[];
};

const ROLE_ARTIFACT_TYPES: Record<SwarmAgentRole, SwarmArtifactType[]> = {
  COORDINATOR: ["plan", "subtasks"],
  ARCHITECT: ["files"],
  DEVELOPER: ["patch"],
  TESTER: ["tests"],
  REVIEWER: ["report"],
  DEVOPS: ["deploy_plan"]
};

const ARTIFACT_TITLES: Record<SwarmArtifactType, string> = {
  plan: "Execution plan",
  subtasks: "Subtasks",
  files: "Affected files",
  patch: "Code patch",
  tests: "Test suite",
  report: "Review report",
  deploy_plan: "Deploy plan"
};

function extractJsonBlock(raw: string): Record<string, unknown> | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? raw.trim();
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* fall through */
  }
  return null;
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(String).join("\n");
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value ?? "");
}

export function parseAgentArtifacts(role: SwarmAgentRole, rawOutput: string): SwarmArtifact[] {
  const types = ROLE_ARTIFACT_TYPES[role];
  const json = extractJsonBlock(rawOutput);
  const artifacts: SwarmArtifact[] = [];

  if (json) {
    for (const type of types) {
      const key = type === "deploy_plan" ? "deploy_plan" : type;
      const altKey = type === "deploy_plan" ? "deployPlan" : type;
      const value = json[key] ?? json[altKey];
      if (value !== undefined && value !== null && String(value).trim()) {
        artifacts.push({
          type,
          title: ARTIFACT_TITLES[type],
          content: asString(value),
          metadata: { source: "json" }
        });
      }
    }
    if (artifacts.length > 0) return artifacts;
  }

  for (const type of types) {
    const sectionRe = new RegExp(`(?:^|\\n)#+\\s*${type.replace("_", "[ _]")}[:\\s]*([\\s\\S]*?)(?=\\n#+\\s|$)`, "i");
    const match = rawOutput.match(sectionRe);
    if (match?.[1]?.trim()) {
      artifacts.push({
        type,
        title: ARTIFACT_TITLES[type],
        content: match[1].trim(),
        metadata: { source: "markdown" }
      });
    }
  }

  if (artifacts.length === 0 && rawOutput.trim()) {
    artifacts.push({
      type: types[0]!,
      title: ARTIFACT_TITLES[types[0]!],
      content: rawOutput.trim().slice(0, 8000),
      metadata: { source: "fallback" }
    });
  }

  return artifacts;
}

export function buildTaskOutput(role: SwarmAgentRole, rawOutput: string): SwarmTaskOutput {
  return {
    text: rawOutput,
    artifacts: parseAgentArtifacts(role, rawOutput)
  };
}

export function mergeRunArtifacts(outputs: SwarmTaskOutput[]): SwarmArtifact[] {
  return outputs.flatMap((o) => o.artifacts);
}

export const PHASE34_PIPELINE_ROLES: SwarmAgentRole[] = [
  "COORDINATOR",
  "ARCHITECT",
  "DEVELOPER",
  "TESTER",
  "REVIEWER",
  "DEVOPS"
];

export const ARTIFACT_PROMPT_SUFFIX: Record<SwarmAgentRole, string> = {
  COORDINATOR:
    'Return JSON with keys "plan" (string) and "subtasks" (array of strings) describing the execution plan.',
  ARCHITECT: 'Return JSON with key "files" (array of file paths or objects with path and reason).',
  DEVELOPER: 'Return JSON with key "patch" (unified diff or patch text).',
  TESTER: 'Return JSON with key "tests" (test cases or test file content).',
  REVIEWER: 'Return JSON with key "report" (review findings and recommendations).',
  DEVOPS: 'Return JSON with key "deploy_plan" (deployment steps and commands).'
};
