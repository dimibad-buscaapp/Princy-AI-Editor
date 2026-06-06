export type PrincyClientOptions = {
  baseUrl: string;
  getToken: () => string | undefined | Promise<string | undefined>;
  onAuthError?: () => void | Promise<void>;
  chatTimeoutMs?: number;
  longTimeoutMs?: number;
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string };
};

export type MeResponse = {
  user: { id: string; email: string; role: string };
};
