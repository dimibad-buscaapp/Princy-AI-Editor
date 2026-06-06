"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BetaBadge } from "../../design-system/BetaBadge";
import { EmptyState } from "../../design-system/EmptyState";
import { ErrorState } from "../../design-system/ErrorState";
import { LoadingSkeleton } from "../../design-system/LoadingSkeleton";
import { apiGet, apiPost } from "../../lib/api-client";

type MarketplaceItem = {
  id: string;
  type: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  version: string;
  installed: boolean;
};

type MarketTab = "agents" | "tools" | "templates" | "themes" | "mcp";

const TAB_TYPE: Record<MarketTab, string | undefined> = {
  agents: "agent",
  tools: "tool",
  templates: "template",
  themes: "theme",
  mcp: "mcp"
};

const TABS: { id: MarketTab; label: string }[] = [
  { id: "agents", label: "Agents" },
  { id: "tools", label: "Tools" },
  { id: "templates", label: "Templates" },
  { id: "themes", label: "Themes" },
  { id: "mcp", label: "MCP Servers" }
];

function isExperimental(version: string) {
  const major = Number(version.split(".")[0]);
  return Number.isFinite(major) && major < 1;
}

export function MarketplaceView() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<MarketTab>("agents");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const type = TAB_TYPE[tab];
      const path = type ? `/agents/marketplace?type=${type}` : "/agents/marketplace";
      const data = await apiGet<{ items: MarketplaceItem[] }>(path);
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar marketplace");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const toggle = async (item: MarketplaceItem) => {
    const action = item.installed ? "uninstall" : "install";
    await apiPost(`/agents/marketplace/${item.type}/${item.id}/${action}`, {});
    await load();
  };

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (tab === "tools") {
      return items.filter(
        (a) => a.category === "DevOps" || a.capabilities.some((c) => c.includes("tool") || c.includes("script"))
      );
    }
    return items;
  }, [items, tab]);

  return (
    <div className="marketplace-view">
      <header className="marketplace-view__header glass-panel">
        <h1>Marketplace V2</h1>
        <p>Agents, tools, templates, themes e MCP servers — manifest unificado.</p>
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

      {tab === "mcp" && !loading && filtered.length === 0 ? (
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

      {!loading && !error ? (
        <div className="marketplace-view__grid">
          {filtered.length === 0 ? (
            <EmptyState title="Nenhum item" description="Não há itens nesta categoria ainda." />
          ) : (
            filtered.map((item) => (
              <article key={`${item.type}-${item.id}`} className="marketplace-card beta-card">
                <div className="marketplace-card__tags">
                  <BetaBadge variant="muted">{item.category}</BetaBadge>
                  <BetaBadge variant={item.installed ? "success" : "muted"}>
                    {item.installed ? "installed" : "available"}
                  </BetaBadge>
                  <BetaBadge variant={item.installed ? "muted" : "code"}>{item.installed ? "local" : "cloud"}</BetaBadge>
                  <BetaBadge variant={isExperimental(item.version) ? "reasoning" : "success"}>
                    {isExperimental(item.version) ? "experimental" : "stable"}
                  </BetaBadge>
                </div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="marketplace-card__caps">
                  {item.capabilities.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <button type="button" className="glow-btn" onClick={() => void toggle(item)}>
                  {item.installed ? "Desativar" : "Instalar"}
                </button>
              </article>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
