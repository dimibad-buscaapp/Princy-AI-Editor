"use client";

import { BetaSettingsPanel } from "./BetaSettingsPanel";
import { ModelosAtivosPanel } from "./ModelosAtivosPanel";
import { SyncStatusPanel } from "./SyncStatusPanel";

export function ConfiguracoesView() {
  return (
    <div className="config-view">
      <header className="config-view__header glass-panel luminous-border">
        <h1>Configurações</h1>
        <p>Preferências Beta locais e modelos ativos do ecossistema Princy.</p>
      </header>
      <SyncStatusPanel />
      <BetaSettingsPanel />
      <ModelosAtivosPanel />
    </div>
  );
}
