import { parseSseChunk, type ChatSseEvent } from "./sse.js";
import type { ChatMessage, LoginResponse, MeResponse, PrincyClientOptions } from "./types.js";

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "").replace(/\/api\/api$/, "/api");
}

function apiUrl(base: string, path: string): string {
  const normalized = normalizeBase(base);
  let p = path.startsWith("/") ? path : `/${path}`;
  if (p.startsWith("/api/")) p = p.slice(4);
  return `${normalized}${p}`;
}

function gatewayUrl(base: string, path: string): string {
  const root = normalizeBase(base).replace(/\/api$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${root}${p}`;
}

export class PrincyClient {
  private readonly baseUrl: string;
  private readonly getToken: PrincyClientOptions["getToken"];
  private readonly onAuthError?: PrincyClientOptions["onAuthError"];
  private readonly chatTimeoutMs: number;
  private readonly longTimeoutMs: number;

  constructor(options: PrincyClientOptions) {
    this.baseUrl = normalizeBase(options.baseUrl);
    this.getToken = options.getToken;
    this.onAuthError = options.onAuthError;
    this.chatTimeoutMs = options.chatTimeoutMs ?? 60_000;
    this.longTimeoutMs = options.longTimeoutMs ?? 120_000;
  }

  private async resolveToken(): Promise<string | undefined> {
    return this.getToken();
  }

  private async request<T>(
    path: string,
    init: RequestInit & { timeoutMs?: number; retryOn401?: boolean } = {}
  ): Promise<T> {
    const { timeoutMs = this.chatTimeoutMs, retryOn401 = true, ...fetchInit } = init;
    const token = await this.resolveToken();
    const headers = new Headers(fetchInit.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (fetchInit.body && !headers.has("Content-Type") && !(fetchInit.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(apiUrl(this.baseUrl, path), {
        ...fetchInit,
        headers,
        signal: controller.signal
      });

      if ((response.status === 401 || response.status === 403) && retryOn401) {
        await this.onAuthError?.();
        const retryToken = await this.resolveToken();
        if (retryToken && retryToken !== token) {
          headers.set("Authorization", `Bearer ${retryToken}`);
          const retry = await fetch(apiUrl(this.baseUrl, path), { ...fetchInit, headers, signal: controller.signal });
          if (!retry.ok) throw await this.parseError(retry);
          const text = await retry.text();
          return text ? (JSON.parse(text) as T) : (undefined as T);
        }
      }

      if (!response.ok) throw await this.parseError(response);
      const text = await response.text();
      return text ? (JSON.parse(text) as T) : (undefined as T);
    } finally {
      clearTimeout(timer);
    }
  }

  private async parseError(response: Response): Promise<Error> {
    const text = await response.text();
    let message = `Request failed (${response.status})`;
    if (text) {
      try {
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        message = text;
      }
    }
    return new Error(message);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.chatTimeoutMs);
    try {
      const response = await fetch(apiUrl(this.baseUrl, "/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      if (!response.ok) throw await this.parseError(response);
      return (await response.json()) as LoginResponse;
    } finally {
      clearTimeout(timer);
    }
  }

  me() {
    return this.request<MeResponse>("/api/auth/me");
  }

  chatComplete(prefix: string, language?: string) {
    return this.request<{ suggestion: string; model?: string }>("/api/chat/complete", {
      method: "POST",
      body: JSON.stringify({ prefix, language })
    });
  }

  ghostText(prefix: string, language?: string) {
    return this.request<{ suggestion: string; model?: string }>("/api/code/ghost-text", {
      method: "POST",
      body: JSON.stringify({ prefix, language })
    });
  }

  codeComplete(objective: string, opts?: { prefix?: string; context?: string; language?: string }) {
    return this.request<{ suggestion: string; model?: string }>("/api/code/complete", {
      method: "POST",
      timeoutMs: this.longTimeoutMs,
      body: JSON.stringify({ objective, ...opts })
    });
  }

  codeExplain(code: string, context?: string) {
    return this.request<{ explanation: string; model?: string }>("/api/code/explain", {
      method: "POST",
      timeoutMs: this.longTimeoutMs,
      body: JSON.stringify({ code, objective: "explain", context })
    });
  }

  codeRefactor(code: string, objective: string, context?: string) {
    return this.request<{ plan: string; refactored: string; model?: string }>("/api/code/refactor", {
      method: "POST",
      timeoutMs: this.longTimeoutMs,
      body: JSON.stringify({ code, objective, context })
    });
  }

  codeFix(code: string, error?: string, opts?: { language?: string; context?: string }) {
    return this.request<{ fix: string; explanation: string; model?: string }>("/api/code/fix", {
      method: "POST",
      timeoutMs: this.longTimeoutMs,
      body: JSON.stringify({ code, error, ...opts })
    });
  }

  codeTests(code: string, context?: string) {
    return this.request<{ tests: string; model?: string }>("/api/code/tests", {
      method: "POST",
      timeoutMs: this.longTimeoutMs,
      body: JSON.stringify({ code, objective: "tests", context })
    });
  }

  patchPreview(patchId: string) {
    return this.request<{ preview: { original: string; modified: string; filePath: string }; patch: unknown }>(
      "/api/patch/preview-id",
      {
        method: "POST",
        body: JSON.stringify({ patchId })
      }
    );
  }

  patchApply(patchId: string) {
    return this.request<{ patch: unknown }>("/api/patch/apply", {
      method: "POST",
      body: JSON.stringify({ patchId })
    });
  }

  patchRollback(patchId: string) {
    return this.request<{ patch: unknown }>("/api/patch/rollback", {
      method: "POST",
      body: JSON.stringify({ patchId })
    });
  }

  workspaceLink(localPath: string, projectId?: string) {
    return this.request<{ workspace: { id: string; projectId: string; path: string } }>("/api/workspace/link", {
      method: "POST",
      body: JSON.stringify({ localPath, projectId })
    });
  }

  workspaceIndex(opts: { workspaceId?: string; localPath?: string; projectId?: string }) {
    return this.request<{
      workspaceId: string;
      projectId: string;
      path: string;
      items: unknown[];
      metadata: Record<string, unknown>;
      contextIndex: unknown;
    }>("/api/workspace/index", {
      method: "POST",
      timeoutMs: this.longTimeoutMs,
      body: JSON.stringify(opts)
    });
  }

  terminalExplainError(output: string, opts?: { cwd?: string; language?: string }) {
    return this.request<{ explanation: string; model?: string }>("/api/terminal/explain-error", {
      method: "POST",
      body: JSON.stringify({ output, ...opts })
    });
  }

  terminalFixError(output: string, opts?: { cwd?: string; language?: string }) {
    return this.request<{
      explanation: string;
      fix: string;
      suggestedCommand: string | null;
      model?: string;
    }>("/api/terminal/fix-error", {
      method: "POST",
      timeoutMs: this.longTimeoutMs,
      body: JSON.stringify({ output, ...opts })
    });
  }

  agentsStatus() {
    return this.request<{ agents: unknown[] }>("/api/agents/status");
  }

  agentsMetrics() {
    return this.request<Record<string, unknown>>("/api/agents/metrics");
  }

  contextGraph(projectId?: string) {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    return this.request<{ nodes: unknown[]; edges?: unknown[] }>(`/api/context/graph${query}`);
  }

  swarmTasks() {
    return this.request<{ tasks: unknown[] }>("/api/swarm/tasks");
  }

  swarmCreateTask(title: string, objective: string, context?: string) {
    return this.request<{ pipelineId: string; tasks: unknown[] }>("/api/swarm/task", {
      method: "POST",
      body: JSON.stringify({ title, objective, context })
    });
  }

  swarmRunTask(taskId: string) {
    return this.request<{ task: unknown }>(`/api/swarm/tasks/${taskId}/run`, {
      method: "POST",
      body: JSON.stringify({})
    });
  }

  workspaceProfile(opts: { workspaceId?: string; localPath?: string }) {
    const query = new URLSearchParams();
    if (opts.workspaceId) query.set("workspaceId", opts.workspaceId);
    if (opts.localPath) query.set("localPath", opts.localPath);
    return this.request<{ profile: unknown }>(`/api/workspace/profile?${query.toString()}`);
  }

  autonomousRun(objective: string, context?: Record<string, unknown>) {
    return this.request<{ plan?: string; output?: string }>("/api/agents/autonomous/run", {
      method: "POST",
      timeoutMs: this.longTimeoutMs,
      body: JSON.stringify({ objective, context })
    });
  }

  async chatStream(
    message: string,
    opts: {
      conversationId?: string;
      projectId?: string;
      agentType?: string;
      thinkingMode?: boolean;
      attachments?: Array<{ type: string; content: string; label?: string }>;
      onEvent: (event: ChatSseEvent) => void;
      signal?: AbortSignal;
    }
  ): Promise<void> {
    const token = await this.resolveToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.chatTimeoutMs);
    const signal = opts.signal;
    if (signal) signal.addEventListener("abort", () => controller.abort());

    try {
      const response = await fetch(apiUrl(this.baseUrl, "/api/chat/stream"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          conversationId: opts.conversationId,
          projectId: opts.projectId,
          agentType: opts.agentType,
          thinkingMode: opts.thinkingMode,
          attachments: opts.attachments
        }),
        signal: controller.signal
      });

      if (!response.ok) throw await this.parseError(response);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseChunk(buffer);
        buffer = parsed.rest;
        for (const event of parsed.events) opts.onEvent(event);
      }

      if (buffer.trim()) {
        const parsed = parseSseChunk(`${buffer}\n\n`);
        for (const event of parsed.events) opts.onEvent(event);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  eventsStreamUrl(): string {
    return gatewayUrl(this.baseUrl, "/api/events/stream");
  }

  systemHealth() {
    return this.request<Record<string, unknown>>("/api/system/health");
  }

  routerStats() {
    return this.request<Record<string, unknown>>("/api/router/stats");
  }

  memoryProject(projectId: string) {
    return this.request<{ chunks: unknown[] }>(`/api/memory/project/${encodeURIComponent(projectId)}`);
  }

  memoryUsage() {
    return this.request<Record<string, unknown>>("/api/memory/usage");
  }

  marketplaceItems(type?: string) {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    return this.request<{ items: unknown[] }>(`/api/agents/marketplace${query}`);
  }

  marketplaceAction(type: string, id: string, action: "install" | "uninstall") {
    return this.request<unknown>(`/api/agents/marketplace/${type}/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({})
    });
  }

  mcpServers() {
    return this.request<{ servers?: unknown[]; items?: unknown[] }>("/api/mcp/servers");
  }

  mcpHealth() {
    return this.request<Record<string, unknown>>("/api/mcp/health");
  }

  mcpTest(serverId: string) {
    return this.request<{ ok: boolean; latencyMs?: number; message?: string }>(
      `/api/mcp/servers/${encodeURIComponent(serverId)}/test`,
      { method: "POST", body: JSON.stringify({}) }
    );
  }

  mcpLogs(serverId: string, tail = 50) {
    return this.request<{ lines: string[] }>(
      `/api/mcp/servers/${encodeURIComponent(serverId)}/logs?tail=${tail}`
    );
  }

  conversationsList(projectId?: string) {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    return this.request<{ conversations: Array<{ id: string; title?: string; updatedAt?: string }> }>(
      `/api/chat/conversations${query}`
    );
  }

  conversationHistory(conversationId: string) {
    return this.request<{ messages: ChatMessage[]; conversationId: string }>(
      `/api/chat/conversations/${encodeURIComponent(conversationId)}`
    );
  }

  conversationCreate(title?: string, projectId?: string) {
    return this.request<{ conversation: { id: string; title?: string } }>("/api/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ title, projectId })
    });
  }

  memoryCreate(projectId: string, content: string, scope?: string, metadata?: Record<string, unknown>) {
    return this.request<{ chunk: unknown }>("/api/memory/chunks", {
      method: "POST",
      body: JSON.stringify({ projectId, content, scope, metadata })
    });
  }

  memoryUpdate(chunkId: string, content: string, metadata?: Record<string, unknown>) {
    return this.request<{ chunk: unknown }>(`/api/memory/chunks/${encodeURIComponent(chunkId)}`, {
      method: "PUT",
      body: JSON.stringify({ content, metadata })
    });
  }

  memoryDelete(chunkId: string) {
    return this.request<{ ok: boolean }>(`/api/memory/chunks/${encodeURIComponent(chunkId)}`, {
      method: "DELETE"
    });
  }

  memorySearch(query: string, projectId?: string, scope?: string) {
    return this.request<{ chunks: unknown[] }>("/api/memory/search", {
      method: "POST",
      body: JSON.stringify({ query, projectId, scope })
    });
  }

  agentMemory(role: string) {
    return this.request<{ items: unknown[] }>(`/api/agents/${encodeURIComponent(role)}/memory`);
  }

  workspaceDetect(opts: { workspaceId?: string; localPath?: string }) {
    const query = new URLSearchParams();
    if (opts.workspaceId) query.set("workspaceId", opts.workspaceId);
    if (opts.localPath) query.set("localPath", opts.localPath);
    return this.request<{ detect: Record<string, unknown> }>(`/api/workspace/detect?${query.toString()}`);
  }

  patchList(workspaceId?: string) {
    const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
    return this.request<{ patches: Array<{ id: string; filePath: string; status: string; summary?: string }> }>(
      `/api/patch/list${query}`
    );
  }

  patchReject(patchId: string) {
    return this.request<{ patch: unknown }>("/api/patch/reject", {
      method: "POST",
      body: JSON.stringify({ patchId })
    });
  }

  refreshToken(refreshToken: string) {
    return this.request<LoginResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      retryOn401: false
    });
  }

  automationGoals() {
    return this.request<{ goals: unknown[] }>("/api/automation/goals");
  }

  automationApprove(id: string) {
    return this.request<unknown>(`/api/automation/approvals/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      body: JSON.stringify({})
    });
  }

  automationReject(id: string) {
    return this.request<unknown>(`/api/automation/approvals/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      body: JSON.stringify({})
    });
  }

  autonomousProjects() {
    return this.request<{ projects: unknown[] }>("/api/autonomous/projects");
  }

  autonomousCancel(runId: string) {
    return this.request<{ ok: boolean }>(`/api/agents/autonomous/cancel/${encodeURIComponent(runId)}`, {
      method: "POST",
      body: JSON.stringify({})
    });
  }

  terminalGenerateCommand(objective: string, context?: string) {
    return this.request<{ command: string; explanation?: string }>("/api/terminal/generate-command", {
      method: "POST",
      body: JSON.stringify({ objective, context })
    });
  }

  observabilityMetrics() {
    return gatewayUrl(this.baseUrl, "/observability/metrics");
  }

  async fetchObservabilityMetrics(): Promise<Record<string, unknown>> {
    const token = await this.resolveToken();
    const url = this.observabilityMetrics();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw await this.parseError(response);
    const text = await response.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { raw: text };
    }
  }
}
