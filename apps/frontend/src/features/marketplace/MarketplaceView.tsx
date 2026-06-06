"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BetaBadge } from "../../design-system/BetaBadge";
import { EmptyState } from "../../design-system/EmptyState";
import { ErrorState } from "../../design-system/ErrorState";
import { LoadingSkeleton } from "../../design-system/LoadingSkeleton";
import { apiGet, apiPost } from "../../lib/api-client";

type CatalogAgent = {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  version: string;
  installed: boolean;
};

type MarketTab = "agents" | "tools" | "templates" | "themes" | "mcp";

const TABS: { id: MarketTab; label: string }[] = [
  { id: "agents", label: "Agents" },
  { id: "tools", label: "Tools" },
  { id: "templates", label: "Templates" },
  { id: "themes", label: "Themes" },
  { id: "mcp", label: "MCP Servers" }
];

const THEME_ITEM = {
  id: "princy-neural-dark",
  name: "Princy Neural Dark",
  description: "Tema escuro premium com glow neural.",
  installed: true,
  version: "1.0.0"
};

function isExperimental(version: string) {
  const major = Number(version.split(".")[0]);
  return Number.isFinite(major) && major < 1;
}

export function MarketplaceView() {
  const [agents, setAgents] = useState<CatalogAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<MarketTab>("agents");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ agents: CatalogAgent[] }>("/agents/marketplace");
      setAgents(data.agents ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar marketplace");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = async (agent: CatalogAgent) => {
    if (agent.installed) {
      await apiPost(`/agents/marketplace/${agent.id}/uninstall`, {});
    } else {
      await apiPost(`/agents/marketplace/${agent.id}/install`, {});
    }
    await load();
  };

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (tab === "agents") return agents;
    if (tab === "tools") {
      return agents.filter(
        (a) => a.category === "DevOps" || a.capabilities.some((c) => c.includes("tool") || c.includes("script"))
      );
    }
    return [];
  }, [agents, tab]);

  return (
    <div className="marketplace-view">
      <header className="marketplace-view__header glass-panel">
        <h1>Marketplace</h1>
        <p>Agents, tools, templates, themes e MCP servers para o Princy Code Beta.</p>
      </header>

      <div className="beta-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`beta-tab ${tab === t.id ? "beta-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSkeleton height={200} /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {tab === "themes" ? (
        <div className="marketplace-view__grid">
          <article className="marketplace-card beta-card">
            <div className="marketplace-card__tags">
              <BetaBadge variant="success">installed</BetaBadge>
              <BetaBadge variant="muted">local</BetaBadge>
              <BetaBadge variant="success">stable</BetaBadge>
            </div>
            <h3>{THEME_ITEM.name}</h3>
            <p>{THEME_ITEM.description}</p>
            <button type="button" disabled className="glow-btn">
              Ativo
            </button>
          </article>
        </div>
      ) : null}

      {tab === "templates" ? (
        <EmptyState
          title="Templates em breve"
          description="Pacotes de projeto e fluxos pré-configurados serão adicionados na próxima fase."
        />
      ) : null}

      {tab === "mcp" ? (
        <EmptyState
          title="MCP Servers"
          description="Configure servidores MCP na página dedicada."
          action={
            <Link href="/mcp" className="glow-btn glow-btn--cyan">
              Abrir MCP
            </Link>
          }
        />
      ) : null}

      {(tab === "agents" || tab === "tools") && !loading && !error ? (
        <div className="marketplace-view__grid">
          {filtered.length === 0 ? (
            <EmptyState title="Nenhum item" description="Não há itens nesta categoria ainda." />
          ) : (
            filtered.map((agent) => (
              <article key={agent.id} className="marketplace-card beta-card">
                <div className="marketplace-card__tags">
                  <BetaBadge variant="muted">{agent.category}</BetaBadge>
                  <BetaBadge variant={agent.installed ? "success" : "muted"}>
                    {agent.installed ? "installed" : "available"}
                  </BetaBadge>
                  <BetaBadge variant={agent.installed ? "muted" : "code"}>{agent.installed ? "local" : "cloud"}</BetaBadge>
                  <BetaBadge variant={isExperimental(agent.version) ? "reasoning" : "success"}>
                    {isExperimental(agent.version) ? "experimental" : "stable"}
                  </BetaBadge>
                </div>
                <h3>{agent.name}</h3>
                <p>{agent.description}</p>
                <div className="marketplace-card__caps">
                  {agent.capabilities.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <button type="button" className="glow-btn" onClick={() => void toggle(agent)}>
                  {agent.installed ? "Desativar" : "Instalar"}
                </button>
              </article>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
