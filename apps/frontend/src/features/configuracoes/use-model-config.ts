"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api-client";

export type ModelSlot = "CHAT" | "EDITOR" | "SWARM" | "AUTONOMOUS" | "EMBED";

export type ModelAssignment = {
  slot: ModelSlot;
  modelId: string;
  tasks: string[];
  updatedAt: string;
};

export type ModelConfig = {
  assignments: ModelAssignment[];
  installed: string[];
  resolved: Record<string, string>;
};

export function useModelConfig() {
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ModelConfig>("/agents/models/config");
      setConfig(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar modelos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function saveSlot(slot: ModelSlot, modelId: string) {
    setSaving(true);
    setError(null);
    try {
      const data = await apiFetch<ModelConfig>("/agents/models/config", {
        method: "PATCH",
        body: { slot, modelId }
      });
      setConfig(data);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar modelo");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { config, loading, saving, error, refresh, saveSlot };
}
