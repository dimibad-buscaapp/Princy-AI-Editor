export type RouterTier = "fast" | "code" | "reasoning" | "unknown";

export function inferRouterTier(modelId?: string): RouterTier {
  if (!modelId) return "unknown";
  const lower = modelId.toLowerCase();
  if (lower.includes("qwen2.5") || lower.includes("qwen2_5") || lower.includes(":3b")) return "fast";
  if (lower.includes("qwen3") && !lower.includes("qwen2")) return "code";
  if (lower.includes("deepseek") || lower.includes("r1")) return "reasoning";
  return "unknown";
}

export function routerTierLabel(tier: RouterTier): string {
  switch (tier) {
    case "fast":
      return "Fast";
    case "code":
      return "Code";
    case "reasoning":
      return "Reasoning";
    default:
      return "Auto";
  }
}
