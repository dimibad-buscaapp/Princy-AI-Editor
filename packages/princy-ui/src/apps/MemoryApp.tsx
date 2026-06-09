import { useState, useCallback } from "react";
import { useVscodeBridge, useInitState } from "../hooks/useVscodeBridge.js";
import { HolographicCard, GlowButton, LoadingSkeleton } from "../components/primitives.js";

const SCOPES = ["PROJECT", "CONVERSATION", "CODE", "AGENT", "SHARED", "TEAM"];

type Chunk = { id: string; content: string; scope?: string; metadata?: Record<string, unknown> };

function MemoryApp() {
  const init = useInitState();
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [usage, setUsage] = useState<Record<string, unknown>>({});
  const [scope, setScope] = useState("PROJECT");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "data") {
      setChunks((msg.chunks as Chunk[]) ?? []);
      setUsage((msg.usage as Record<string, unknown>) ?? {});
      setLoading(false);
    }
  }, []);

  const { post } = useVscodeBridge(onMessage);

  return (
    <div className={!init.motionEnabled ? "no-motion" : ""}>
      <div className="toolbar">
        <input className="search-input" placeholder="Search memory..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && post("search", { query: search, scope })} />
        <GlowButton onClick={() => post("search", { query: search, scope })}>Search</GlowButton>
        <GlowButton variant="ghost" onClick={() => post("refresh")}>Refresh</GlowButton>
      </div>
      <div className="tabs">
        {SCOPES.map((s) => (
          <span key={s} className={`tab ${scope === s ? "active" : ""}`} onClick={() => { setScope(s); post("filterScope", { scope: s }); }}>{s}</span>
        ))}
      </div>
      {loading ? <LoadingSkeleton /> : null}
      <HolographicCard title="Usage">
        <pre style={{ fontSize: 11, margin: 0 }}>{JSON.stringify(usage, null, 2)}</pre>
      </HolographicCard>
      {chunks.map((c) => (
        <HolographicCard key={c.id} title={c.scope ?? "chunk"}>
          <p style={{ fontSize: 12, margin: "0 0 8px" }}>{c.content.slice(0, 300)}</p>
          <GlowButton variant="ghost" onClick={() => post("delete", { id: c.id })}>Delete</GlowButton>
        </HolographicCard>
      ))}
      <div className="chat-input-row">
        <textarea rows={2} value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="New memory chunk..." />
        <GlowButton onClick={() => { post("create", { content: newContent, scope }); setNewContent(""); }}>Add</GlowButton>
      </div>
    </div>
  );
}

export default MemoryApp;
