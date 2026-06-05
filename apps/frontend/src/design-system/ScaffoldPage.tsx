"use client";

import { HolographicCard } from "./HolographicCard";
import { NeuralGlow } from "./NeuralGlow";

type ScaffoldPageProps = {
  title: string;
  subtitle: string;
};

export function ScaffoldPage({ title, subtitle }: ScaffoldPageProps) {
  return (
    <div className="scaffold-page">
      <div className="scaffold-page__hero glass-panel luminous-border">
        <NeuralGlow size={200} />
        <div>
          <p className="eyebrow">Em expansão neural</p>
          <h1 className="scaffold-page__title">{title}</h1>
          <p className="scaffold-page__subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="scaffold-page__grid">
        <HolographicCard title="Módulo em sincronização" description="Interface pronta. Integração com Princy Core em andamento." />
        <HolographicCard title="Agentes conectados" description="Swarm e memória serão vinculados nesta área." />
        <HolographicCard title="Autonomia futura" description="Operações autônomas habilitadas em breve." />
      </div>
    </div>
  );
}
