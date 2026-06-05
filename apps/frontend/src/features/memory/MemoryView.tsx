"use client";

import { Brain, Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
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

const SCOPES = ["USER", "PROJECT", "CONVERSATION", "WORKSPACE", "AGENT"] as const;

export function MemoryView() {
  const [chunks, setChunks] = useState<MemoryChunk[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [scope, setScope] = useState<string>("");
  const [query, setQuery] = useState("");
  const [projectId] = useState("demo");

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<{ chunks: MemoryChunk[] }>(`/api/memory/project/${projectId}`);
        setChunks(data.chunks ?? []);
      } catch {
        setChunks([]);
      }
      try {
        const u = await apiFetch<UsageStats>("/api/memory/usage");
        setUsage(u);
      } catch {
        setUsage(null);
      }
    })();
  }, [projectId]);

  async function searchMemory() {
    if (!query.trim()) return;
    const data = await apiFetch<{ results: Array<{ chunk: MemoryChunk; score?: number }> }>("/api/memory/search", {
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
    </div>
  );
}
