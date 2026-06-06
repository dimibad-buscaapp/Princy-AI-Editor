"use client";

import { Brain, Filter, RefreshCw, Search, UserCog } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HolographicCard } from "../../design-system/HolographicCard";
import { apiFetch } from "../../lib/api-client";

type MemoryChunk = {
  id: string;
  title?: string | null;
  content: string;
  scope: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

type UsageStats = {
  byScope: Record<string, number>;
  total: number;
  recentQueries: Array<{ query: string; score: number; at: string }>;
};

type AgentMemoryItem = {
  id: string;
  kind: string;
  content: string | null;
  decision: string | null;
  success: boolean;
  projectId: string | null;
  recurrenceKey: string | null;
  createdAt: string;
};

type RecurringError = {
  key: string;
  count: number;
  lastSeen: string;
  sample: string;
};

type AgentMemoryResponse = {
  agentId: string;
  stats: { total: number; success: number; failure: number; avgDurationMs: number };
  memories: AgentMemoryItem[];
  recurringErrors: RecurringError[];
  projectPreferences: Array<{ id: string; projectId: string | null; content: string; createdAt: string }>;
};

const SCOPES = ["USER", "PROJECT", "CONVERSATION", "WORKSPACE", "AGENT"] as const;
const AGENT_ROLES = ["COORDINATOR", "ARCHITECT", "DEVELOPER", "TESTER", "REVIEWER", "DEVOPS"] as const;
const MEMORY_KINDS = ["", "decision", "error", "preference", "context"] as const;

export function MemoryView() {
  const [chunks, setChunks] = useState<MemoryChunk[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [scope, setScope] = useState<string>("");
  const [query, setQuery] = useState("");
  const [projectId] = useState("demo");

  const [agentRole, setAgentRole] = useState<string>("DEVELOPER");
  const [agentKind, setAgentKind] = useState<string>("");
  const [agentMemory, setAgentMemory] = useState<AgentMemoryResponse | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<{ chunks: MemoryChunk[] }>(`/memory/project/${projectId}`);
        setChunks(data.chunks ?? []);
      } catch {
        setChunks([]);
      }
      try {
        const u = await apiFetch<UsageStats>("/memory/usage");
        setUsage(u);
      } catch {
        setUsage(null);
      }
    })();
  }, [projectId]);

  const loadAgentMemory = useCallback(async () => {
    setAgentLoading(true);
    try {
      const params = new URLSearchParams({ projectId, limit: "30" });
      if (agentKind) params.set("kind", agentKind);
      const data = await apiFetch<AgentMemoryResponse>(`/agents/${agentRole}/memory?${params}`);
      setAgentMemory(data);
    } catch {
      setAgentMemory(null);
    } finally {
      setAgentLoading(false);
    }
  }, [agentRole, agentKind, projectId]);

  useEffect(() => {
    void loadAgentMemory();
  }, [loadAgentMemory]);

  async function searchMemory() {
    if (!query.trim()) return;
    const data = await apiFetch<{ results: Array<{ chunk: MemoryChunk; score?: number }> }>("/memory/search", {
      method: "POST",
      body: { query, scope: scope || undefined, projectId, mode: "hybrid" }
    });
    setChunks((data.results ?? []).map((r) => ({ ...r.chunk, metadata: { ...r.chunk.metadata, relevance: r.score } })));
  }

  const filtered = scope ? chunks.filter((c) => c.scope === scope) : chunks;

  return (
    <div className="memory-view">
      <header className="memory-view__header glass-panel luminous-border">
        <h1><Brain size={20} /> Memória Neural</h1>
        <p>Embeddings, RAG e contexto persistente dos agentes Princy.</p>
      </header>
      <div className="memory-view__toolbar">
        <div className="memory-view__search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar memória..." onKeyDown={(e) => e.key === "Enter" && searchMemory()} />
        </div>
        <div className="memory-view__filters">
          <Filter size={14} />
          {SCOPES.map((s) => (
            <button key={s} type="button" className={scope === s ? "active" : ""} onClick={() => setScope(scope === s ? "" : s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="memory-view__grid">
        <HolographicCard title={`Lembranças (${filtered.length})`}>
          <ul className="memory-view__list">
            {filtered.map((c) => (
              <li key={c.id} className="memory-view__item glass-panel">
                <strong>{c.title ?? c.scope}</strong>
                <span className="memory-view__scope">{c.scope}</span>
                <p>{c.content.slice(0, 200)}{c.content.length > 200 ? "…" : ""}</p>
                {c.metadata?.relevance != null ? (
                  <span className="memory-view__score">score: {String(c.metadata.relevance)}</span>
                ) : null}
              </li>
            ))}
            {filtered.length === 0 ? <li className="memory-view__empty">Nenhuma memória encontrada.</li> : null}
          </ul>
        </HolographicCard>
        <HolographicCard title="Uso por Agentes">
          {usage ? (
            <>
              <p>Total: {usage.total} chunks</p>
              <ul>
                {Object.entries(usage.byScope).map(([k, v]) => (
                  <li key={k}>{k}: {v}</li>
                ))}
              </ul>
              <h4>Últimas queries RAG</h4>
              <ul className="memory-view__rag">
                {(usage.recentQueries ?? []).map((q, i) => (
                  <li key={i}>{q.query} — {q.score.toFixed(2)}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>Carregando estatísticas...</p>
          )}
        </HolographicCard>
      </div>

      <section className="memory-view__agent-section glass-panel luminous-border">
        <header className="memory-view__agent-header">
          <h2><UserCog size={18} /> Agent Memory</h2>
          <button type="button" className="memory-view__refresh" onClick={() => void loadAgentMemory()} disabled={agentLoading}>
            <RefreshCw size={14} /> {agentLoading ? "Carregando…" : "Atualizar"}
          </button>
        </header>
        <div className="memory-view__agent-toolbar">
          <label>
            Agente
            <select value={agentRole} onChange={(e) => setAgentRole(e.target.value)}>
              {AGENT_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select value={agentKind} onChange={(e) => setAgentKind(e.target.value)}>
              {MEMORY_KINDS.map((k) => (
                <option key={k || "all"} value={k}>{k || "todos"}</option>
              ))}
            </select>
          </label>
        </div>

        {agentMemory ? (
          <div className="memory-view__agent-grid">
            <div className="memory-view__agent-stats">
              <span>Total: {agentMemory.stats.total}</span>
              <span className="ok">OK: {agentMemory.stats.success}</span>
              <span className="fail">Falhas: {agentMemory.stats.failure}</span>
              <span>Ø {agentMemory.stats.avgDurationMs}ms</span>
            </div>

            {(agentMemory.recurringErrors ?? []).length > 0 ? (
              <div className="memory-view__recurring">
                <h3>Erros recorrentes</h3>
                <ul>
                  {agentMemory.recurringErrors.map((e) => (
                    <li key={e.key}>
                      <strong>{e.count}x</strong> {e.sample.slice(0, 120)}
                      <span className="memory-view__recurring-key">{e.key}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <ul className="memory-view__list memory-view__agent-list">
              {(agentMemory.memories ?? []).map((m) => (
                <li key={m.id} className={`memory-view__item memory-view__item--${m.kind}`}>
                  <span className="memory-view__kind">{m.kind}</span>
                  {!m.success ? <span className="memory-view__fail-badge">falha</span> : null}
                  <p>{(m.content ?? m.decision ?? "").slice(0, 240)}</p>
                  {m.projectId ? <span className="memory-view__scope">{m.projectId}</span> : null}
                </li>
              ))}
              {(agentMemory.memories ?? []).length === 0 ? (
                <li className="memory-view__empty">Sem memórias para este agente.</li>
              ) : null}
            </ul>
          </div>
        ) : (
          <p className="memory-view__empty">Não foi possível carregar memória do agente.</p>
        )}
      </section>
    </div>
  );
}
