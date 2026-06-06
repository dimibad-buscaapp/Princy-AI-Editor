"use client";

import { useState } from "react";
import { GlowButton } from "../../design-system/GlowButton";
import { HolographicCard } from "../../design-system/HolographicCard";
import { useToast } from "../../design-system/Toast";
import { type ModelSlot, useModelConfig } from "./use-model-config";

const SLOT_LABELS: Record<ModelSlot, string> = {
  CHAT: "Chat",
  EDITOR: "Editor",
  SWARM: "Swarm",
  AUTONOMOUS: "Autonomous",
  EMBED: "Embeddings"
};

const EDITABLE_SLOTS: ModelSlot[] = ["CHAT", "EDITOR", "SWARM", "AUTONOMOUS"];

export function ModelosAtivosPanel() {
  const toast = useToast();
  const { config, loading, saving, error, saveSlot } = useModelConfig();
  const [draft, setDraft] = useState<Partial<Record<ModelSlot, string>>>({});

  const installed = config?.installed?.length ? config.installed : ["qwen2.5:3b", "deepseek-r1:8b", "nomic-embed-text"];

  async function handleSave(slot: ModelSlot) {
    const modelId = draft[slot] ?? config?.assignments.find((a) => a.slot === slot)?.modelId;
    if (!modelId) return;
    const ok = await saveSlot(slot, modelId);
    if (ok) toast.show(`${SLOT_LABELS[slot]} atualizado para ${modelId}`);
  }

  if (loading) {
    return <HolographicCard title="Modelos Ativos"><p>Carregando...</p></HolographicCard>;
  }

  return (
    <HolographicCard title="Modelos Ativos">
      {error ? <p className="config-view__error">{error}</p> : null}
      <div className="config-view__models">
        {EDITABLE_SLOTS.map((slot) => {
          const current = config?.assignments.find((a) => a.slot === slot);
          const value = draft[slot] ?? current?.modelId ?? "";
          return (
            <div key={slot} className="config-view__model-row">
              <label htmlFor={`model-${slot}`}>
                <strong>{SLOT_LABELS[slot]}</strong>
                <small>{current?.tasks.join(", ")}</small>
              </label>
              <select
                id={`model-${slot}`}
                value={value}
                onChange={(e) => setDraft((d) => ({ ...d, [slot]: e.target.value }))}
              >
                {installed.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <GlowButton variant="violet" disabled={saving} onClick={() => void handleSave(slot)}>
                Salvar
              </GlowButton>
            </div>
          );
        })}
        <div className="config-view__model-row config-view__model-row--readonly">
          <label>
            <strong>{SLOT_LABELS.EMBED}</strong>
            <small>MEMORY, RAG, contexto</small>
          </label>
          <span>{config?.resolved.EMBED ?? "nomic-embed-text"}</span>
        </div>
      </div>
    </HolographicCard>
  );
}
