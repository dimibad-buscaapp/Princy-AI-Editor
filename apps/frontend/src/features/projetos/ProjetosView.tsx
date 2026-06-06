"use client";

import { TeamsPanel } from "./TeamsPanel";

export function ProjetosView() {
  return (
    <div className="projetos-view">
      <header className="glass-panel luminous-border">
        <h1>Projetos</h1>
        <p>Gestão neural de workspaces, times e repositórios Princy.</p>
      </header>
      <TeamsPanel />
    </div>
  );
}
