"use client";

import { ServiceStatusPanel } from "./ServiceStatusPanel";

export function SystemHealthView() {
  return (
    <div className="system-view">
      <header className="system-view__header glass-panel luminous-border">
        <h1>System Health</h1>
        <p>Status completo dos serviços Princy Code Beta — atualização manual ou refresh.</p>
      </header>
      <ServiceStatusPanel />
    </div>
  );
}
