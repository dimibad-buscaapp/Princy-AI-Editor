function envModel(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const DEFAULT_FAST_MODEL = envModel(
  "DEFAULT_FAST_MODEL",
  envModel("CHAT_FAST_MODEL", envModel("OLLAMA_CHAT_MODEL", envModel("DEFAULT_CHAT_MODEL", "qwen2.5:3b")))
);

export const DEFAULT_CODE_MODEL = envModel("DEFAULT_CODE_MODEL", "qwen3:8b");

export const DEFAULT_REASONING_MODEL = envModel(
  "DEFAULT_REASONING_MODEL",
  envModel("CHAT_DEEP_MODEL", "deepseek-r1:8b")
);

export function isFastModel(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return lower.includes("qwen2.5") || lower.includes("qwen2_5") || lower.includes(":3b");
}

export function isCodeModel(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return lower.includes("qwen3") && !lower.includes("qwen2");
}

export function isReasoningModel(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return lower.includes("deepseek") || lower.includes("r1");
}
