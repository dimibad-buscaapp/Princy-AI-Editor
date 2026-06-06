"use client";

import { ModelosAtivosPanel } from "./ModelosAtivosPanel";

export function ConfiguracoesView() {
  return (
    <div className="config-view">
      <header className="config-view__header glass-panel luminous-border">
        <h1>Configurações</h1>
        <p>Modelos ativos e parâmetros do ecossistema Princy.</p>
      </header>
      <ModelosAtivosPanel />
    </div>
  );
}
