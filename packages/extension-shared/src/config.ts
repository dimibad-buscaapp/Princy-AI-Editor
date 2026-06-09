/** Default Princy service URLs (production VPS). */
export const PRINCY_SERVICES = {
  frontendUrl: "http://13.140.129.77:3400",
  gatewayUrl: "http://13.140.129.77:3407",
  apiUrl: "http://13.140.129.77:3407",
  agentsUrl: "http://13.140.129.77:3402",
  workspaceUrl: "http://13.140.129.77:3403",
  contextUrl: "http://13.140.129.77:3404",
  memoryUrl: "http://13.140.129.77:3405",
  automationUrl: "http://13.140.129.77:3406",
  schedulerUrl: "http://13.140.129.77:3409",
  mcpUrl: "http://13.140.129.77:3408"
} as const;

export const DEFAULT_GATEWAY_API = `${PRINCY_SERVICES.gatewayUrl}/api`;

const LOOPBACK_PATTERNS = [
  /^https?:\/\/localhost(?:[:/]|$)/i,
  /^https?:\/\/127\.0\.0\.1(?:[:/]|$)/i,
  /^https?:\/\/\[::1\](?:[:/]|$)/i,
  /^https?:\/\/0\.0\.0\.0(?:[:/]|$)/i
];

/** Reject localhost / loopback URLs (VPS-only policy). */
export function isLoopbackUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return LOOPBACK_PATTERNS.some((p) => p.test(trimmed));
}

export const PRINCY_URL_SETTING_KEYS = [
  "princy.endpoint",
  "princy.frontendUrl",
  "princy.agentsUrl",
  "princy.workspaceUrl",
  "princy.contextUrl",
  "princy.memoryUrl",
  "princy.automationUrl",
  "princy.schedulerUrl",
  "princy.mcpUrl"
] as const;
