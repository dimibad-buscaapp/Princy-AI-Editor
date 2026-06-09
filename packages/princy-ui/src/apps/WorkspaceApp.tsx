import { useState, useCallback } from "react";
import { useVscodeBridge, useInitState } from "../hooks/useVscodeBridge.js";
import { HolographicCard, GlowButton, LoadingSkeleton } from "../components/primitives.js";
import { DiffViewerSummary } from "../components/DiffViewerSummary.js";

function WorkspaceApp() {
  const init = useInitState();
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [detect, setDetect] = useState<Record<string, unknown>>({});
  const [patches, setPatches] = useState<Array<{ id: string; filePath: string; summary?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "data") {
      setProfile((msg.profile as Record<string, unknown>) ?? {});
      setDetect((msg.detect as Record<string, unknown>) ?? {});
      setPatches((msg.patches as typeof patches) ?? []);
      setLoading(false);
    }
  }, []);

  const { post } = useVscodeBridge(onMessage);

  return (
    <div className={!init.motionEnabled ? "no-motion" : ""}>
      <div className="toolbar">
        <GlowButton onClick={() => post("index")}>Index Workspace</GlowButton>
        <GlowButton variant="ghost" onClick={() => post("refresh")}>Refresh</GlowButton>
      </div>
      {loading ? <LoadingSkeleton /> : null}
      <HolographicCard title="Stack Detection">
        <pre style={{ fontSize: 11, margin: 0 }}>{JSON.stringify(detect, null, 2)}</pre>
      </HolographicCard>
      <HolographicCard title="Profile">
        <pre style={{ fontSize: 11, margin: 0, maxHeight: 200, overflow: "auto" }}>{JSON.stringify(profile, null, 2)}</pre>
      </HolographicCard>
      <h3 style={{ color: "var(--violet)", fontSize: 13, padding: "0 12px" }}>Patches</h3>
      {patches.map((p) => (
        <DiffViewerSummary key={p.id} filePath={p.filePath} summary={p.summary} onOpenDiff={() => post("previewPatch", { patchId: p.id })} />
      ))}
      {patches.length ? (
        <div className="toolbar">
          <GlowButton onClick={() => post("applyPatch", { patchId: patches[0]?.id })}>Apply</GlowButton>
          <GlowButton variant="danger" onClick={() => post("rollbackPatch", { patchId: patches[0]?.id })}>Rollback</GlowButton>
        </div>
      ) : null}
    </div>
  );
}

export default WorkspaceApp;
