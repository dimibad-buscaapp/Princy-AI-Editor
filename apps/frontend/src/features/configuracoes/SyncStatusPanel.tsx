"use client";

import { Cloud, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HolographicCard } from "../../design-system/HolographicCard";
import { apiFetch } from "../../lib/api-client";
import { useBetaSettings } from "./use-beta-settings";

type SyncStatus = {
  synced: number;
  conflict: number;
  queuePending: number;
  queueConflict: number;
  lastCheck: string;
};

export function SyncStatusPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { settings } = useBetaSettings();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await apiFetch<SyncStatus>("/sync/status");
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function pushSettings() {
    await apiFetch("/sync/push", {
      method: "POST",
      body: {
        items: [{
          entity: "settings",
          entityId: "beta",
          payload: settings as Record<string, unknown>,
          updatedAt: new Date().toISOString()
        }]
      }
    });
    await refresh();
  }

  async function pullSettings() {
    const data = await apiFetch<{ states: Array<{ entity: string; entityId: string }> }>("/sync/pull");
    if (data.states?.length) await refresh();
  }

  return (
    <HolographicCard title="Cloud Sync">
      {status ? (
        <>
          <p>Sincronizados: {status.synced} · Conflitos: {status.conflict}</p>
          <p>Fila pendente: {status.queuePending} · Conflitos na fila: {status.queueConflict}</p>
          <p className="config-view__muted">Última verificação: {new Date(status.lastCheck).toLocaleString()}</p>
        </>
      ) : (
        <p>Carregando status de sync...</p>
      )}
      <div className="config-view__actions">
        <button type="button" onClick={() => void pushSettings()} disabled={loading}>
          Push settings
        </button>
        <button type="button" onClick={() => void pullSettings()} disabled={loading}>
          Pull
        </button>
        <button type="button" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>
    </HolographicCard>
  );
}
