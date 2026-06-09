import { useState, useCallback } from "react";
import { useVscodeBridge } from "../hooks/useVscodeBridge.js";
import { GlowButton, HolographicCard } from "../components/primitives.js";

const CATEGORIES = ["AI", "Models", "Swarm", "Memory", "Workspace", "Marketplace", "MCP", "Appearance", "Advanced"];

function SettingsApp() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [category, setCategory] = useState("AI");
  const [importJson, setImportJson] = useState("");

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "settings") setSettings(msg.settings as Record<string, unknown>);
  }, []);

  const { post } = useVscodeBridge(onMessage);

  const keys = Object.keys(settings).filter((k) => {
    const catMap: Record<string, string[]> = {
      AI: ["endpoint", "enableGhostText", "ghostTextDebounceMs", "chatAnimations", "motionEnabled"],
      Models: ["model"],
      Swarm: ["swarmLiveUpdates", "agentsUrl"],
      Memory: ["memoryUrl", "defaultProjectId"],
      Workspace: ["workspaceUrl", "contextUrl"],
      Marketplace: ["frontendUrl"],
      MCP: ["mcpUrl"],
      Appearance: ["defaultTheme"],
      Advanced: ["automationUrl", "schedulerUrl", "enableAutonomousMode"]
    };
    return (catMap[category] ?? []).some((prefix) => k.includes(prefix));
  });

  return (
    <div>
      <div className="tabs">
        {CATEGORIES.map((c) => (
          <span key={c} className={`tab ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</span>
        ))}
      </div>
      <HolographicCard title={category}>
        {keys.map((k) => (
          <div key={k} style={{ marginBottom: 8, fontSize: 12 }}>
            <label>{k}</label>
            <input type="text" style={{ width: "100%", marginTop: 4 }} value={String(settings[k] ?? "")} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} onBlur={() => post("update", { key: k, value: settings[k] })} />
          </div>
        ))}
      </HolographicCard>
      <div className="toolbar">
        <GlowButton onClick={() => post("export")}>Export JSON</GlowButton>
        <GlowButton variant="ghost" onClick={() => post("import", { json: importJson })}>Import</GlowButton>
      </div>
      <textarea rows={4} style={{ width: "100%", margin: 8, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }} value={importJson} onChange={(e) => setImportJson(e.target.value)} placeholder="Paste settings JSON..." />
    </div>
  );
}

export default SettingsApp;
