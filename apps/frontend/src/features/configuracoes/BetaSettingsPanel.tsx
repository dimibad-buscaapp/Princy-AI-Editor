"use client";

import { useBetaSettings } from "./use-beta-settings";

export function BetaSettingsPanel() {
  const { settings, loaded, update, reset } = useBetaSettings();

  if (!loaded) return <p className="config-view__muted">Carregando preferências...</p>;

  return (
    <section className="config-view__panel beta-card">
      <h2>Princy Code Beta</h2>
      <p className="config-view__muted">Preferências locais (salvas no navegador).</p>

      <div className="beta-settings__grid">
        <label>
          Modelo rápido
          <input
            value={settings.fastModel}
            onChange={(e) => update({ fastModel: e.target.value })}
            className="config-view__input"
          />
        </label>
        <label>
          Modelo de código
          <input
            value={settings.codeModel}
            onChange={(e) => update({ codeModel: e.target.value })}
            className="config-view__input"
          />
        </label>
        <label>
          Modelo de reasoning
          <input
            value={settings.reasoningModel}
            onChange={(e) => update({ reasoningModel: e.target.value })}
            className="config-view__input"
          />
        </label>
        <label>
          Endpoint Ollama
          <input
            value={settings.ollamaEndpoint}
            onChange={(e) => update({ ollamaEndpoint: e.target.value })}
            className="config-view__input"
          />
        </label>
        <label>
          Tema
          <select
            value={settings.theme}
            onChange={(e) => update({ theme: e.target.value })}
            className="config-view__input"
          >
            <option value="princy-neural-dark">Princy Neural Dark</option>
          </select>
        </label>
      </div>

      <div className="beta-settings__toggles">
        <label className="beta-settings__toggle">
          <input
            type="checkbox"
            checked={settings.autonomousEnabled}
            onChange={(e) => update({ autonomousEnabled: e.target.checked })}
          />
          Modo autônomo habilitado
        </label>
        <label className="beta-settings__toggle">
          <input
            type="checkbox"
            checked={settings.cacheEnabled}
            onChange={(e) => update({ cacheEnabled: e.target.checked })}
          />
          Cache de chat ligado
        </label>
        <label className="beta-settings__toggle">
          <input
            type="checkbox"
            checked={settings.contextCompressionEnabled}
            onChange={(e) => update({ contextCompressionEnabled: e.target.checked })}
          />
          Contexto comprimido ligado
        </label>
      </div>

      <button type="button" className="glow-btn" onClick={reset} style={{ marginTop: 12 }}>
        Restaurar padrões
      </button>
    </section>
  );
}
