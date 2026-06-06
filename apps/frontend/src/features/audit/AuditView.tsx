"use client";

import { ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { HolographicCard } from "../../design-system/HolographicCard";
import { apiFetch } from "../../lib/api-client";

type AuditLog = {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export function AuditView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<{ logs: AuditLog[] }>("/audit?limit=100");
        setLogs(data.logs ?? []);
      } catch {
        setLogs([]);
      }
    })();
  }, []);

  return (
    <div className="audit-view">
      <header className="audit-view__header glass-panel">
        <h1><ScrollText size={20} /> Audit Logs</h1>
        <p>Trilha de auditoria de ações críticas do ecossistema Princy.</p>
      </header>
      <HolographicCard title={`Eventos (${logs.length})`}>
        <ul className="audit-view__list">
          {logs.map((log) => (
            <li key={log.id} className="audit-view__item glass-panel">
              <strong>{log.action}</strong>
              <span>{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}</span>
              <time>{new Date(log.createdAt).toLocaleString()}</time>
            </li>
          ))}
          {logs.length === 0 ? <li className="audit-view__empty">Nenhum evento registrado.</li> : null}
        </ul>
      </HolographicCard>
    </div>
  );
}
