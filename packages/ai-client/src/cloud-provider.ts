export type CloudProviderId = "ollama" | "openai" | "anthropic" | "azure";

export type CloudProviderConfig = {
  id: CloudProviderId;
  baseUrl?: string;
  apiKey?: string;
  enabled: boolean;
};

const providers: CloudProviderConfig[] = [
  { id: "ollama", baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434", enabled: true },
  { id: "openai", baseUrl: "https://api.openai.com/v1", apiKey: process.env.OPENAI_API_KEY, enabled: Boolean(process.env.OPENAI_API_KEY) },
  { id: "anthropic", enabled: Boolean(process.env.ANTHROPIC_API_KEY) },
  { id: "azure", enabled: Boolean(process.env.AZURE_OPENAI_API_KEY) }
];

export function listCloudProviders(): CloudProviderConfig[] {
  return providers.map((p) => ({ ...p, apiKey: p.apiKey ? "***" : undefined }));
}

export function resolveCloudProvider(id: CloudProviderId): CloudProviderConfig | undefined {
  return providers.find((p) => p.id === id);
}
