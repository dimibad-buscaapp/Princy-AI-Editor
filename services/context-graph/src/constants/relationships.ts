export const CONTEXT_RELATIONSHIPS = [
  "IMPORTS",
  "CALLS",
  "EXTENDS",
  "IMPLEMENTS",
  "USES",
  "REFERENCES"
] as const;

export type ContextRelationship = (typeof CONTEXT_RELATIONSHIPS)[number];
