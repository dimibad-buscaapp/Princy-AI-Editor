"use client";

import { useCallback, useEffect, useState } from "react";
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

export function MarketplaceView() {
  const [agents, setAgents] = useState<CatalogAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ agents: CatalogAgent[] }>("/agents/marketplace");
      setAgents(data.agents ?? []);
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

  return (
    <div className="marketplace-view">
      <header className="marketplace-view__header">
        <h1>Marketplace de Agentes</h1>
        <p>Instale agentes especializados para o Swarm Princy.</p>
      </header>
      {loading ? <p>Carregando catálogo...</p> : null}
      <div className="marketplace-view__grid">
        {agents.map((agent) => (
          <article key={agent.id} className="marketplace-card">
            <div className="marketplace-card__badge">{agent.category}</div>
            <h3>{agent.name}</h3>
            <p>{agent.description}</p>
            <div className="marketplace-card__caps">
              {agent.capabilities.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <button type="button" onClick={() => void toggle(agent)}>
              {agent.installed ? "Desinstalar" : "Instalar"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
