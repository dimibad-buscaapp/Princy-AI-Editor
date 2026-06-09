import { useState, useCallback } from "react";
import { useVscodeBridge, useInitState } from "../hooks/useVscodeBridge.js";
import { GlowButton, LoadingSkeleton } from "../components/primitives.js";

const TABS = ["agents", "tools", "templates", "themes", "workflows"];

type Item = { id: string; name: string; description?: string; installed?: boolean };

function MarketplaceApp() {
  const init = useInitState();
  const [tab, setTab] = useState("agents");
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "data") {
      setItems((msg.items as Item[]) ?? []);
      setLoading(false);
      setError(null);
    }
    if (msg.type === "error") {
      setError(msg.message as string);
      setLoading(false);
    }
  }, []);

  const { post } = useVscodeBridge(onMessage);

  const filtered = items.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={!init.motionEnabled ? "no-motion" : ""}>
      <div className="toolbar">
        <input className="search-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="tabs">
        {TABS.map((t) => (
          <span key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => { setTab(t); post("loadTab", { tab: t }); }}>{t}</span>
        ))}
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <LoadingSkeleton /> : null}
      {filtered.map((item) => (
        <div key={item.id} className="holo-card glass-panel" style={{ padding: 12, margin: 8 }}>
          <strong>{item.name}</strong>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0" }}>{item.description}</p>
          <GlowButton onClick={() => post("action", { tab, id: item.id, action: item.installed ? "uninstall" : "install" })}>
            {item.installed ? "Uninstall" : "Install"}
          </GlowButton>
        </div>
      ))}
    </div>
  );
}

export default MarketplaceApp;
