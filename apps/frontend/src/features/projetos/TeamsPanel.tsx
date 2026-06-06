"use client";

import { useEffect, useState } from "react";
import { HolographicCard } from "../../design-system/HolographicCard";
import { apiFetch } from "../../lib/api-client";

export function TeamsPanel() {
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [shared, setShared] = useState<Array<{ id: string; path: string; projectName?: string }>>([]);

  useEffect(() => {
    void (async () => {
      try {
        const o = await apiFetch<{ orgs: typeof orgs }>("/orgs");
        setOrgs(o.orgs ?? []);
      } catch { setOrgs([]); }
      try {
        const t = await apiFetch<{ teams: typeof teams }>("/teams");
        setTeams(t.teams ?? []);
      } catch { setTeams([]); }
      try {
        const w = await apiFetch<{ workspaces: typeof shared }>("/workspaces/shared");
        setShared(w.workspaces ?? []);
      } catch { setShared([]); }
    })();
  }, []);

  return (
    <div className="projetos-teams">
      <HolographicCard title="Organizações">
        <ul>{orgs.map((o) => <li key={o.id}>{o.name} ({o.slug})</li>)}{orgs.length === 0 ? <li>Nenhuma org</li> : null}</ul>
      </HolographicCard>
      <HolographicCard title="Times">
        <ul>{teams.map((t) => <li key={t.id}>{t.name}</li>)}{teams.length === 0 ? <li>Nenhum time</li> : null}</ul>
      </HolographicCard>
      <HolographicCard title="Workspaces compartilhados">
        <ul>{shared.map((w) => <li key={w.id}>{w.projectName ?? "proj"} — {w.path}</li>)}{shared.length === 0 ? <li>Nenhum compartilhado</li> : null}</ul>
      </HolographicCard>
    </div>
  );
}
