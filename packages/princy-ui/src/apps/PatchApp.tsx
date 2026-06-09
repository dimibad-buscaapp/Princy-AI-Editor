import { useState, useCallback } from "react";
import { useVscodeBridge, useInitState } from "../hooks/useVscodeBridge.js";
import { GlowButton, LoadingSkeleton } from "../components/primitives.js";
import { DiffViewerSummary } from "../components/DiffViewerSummary.js";
import { animationClasses } from "../animations/index.js";

type Patch = { id: string; filePath: string; status: string; summary?: string };

function PatchApp() {
  const init = useInitState();
  const [patches, setPatches] = useState<Patch[]>([]);
  const [applying, setApplying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "data") {
      setPatches((msg.patches as Patch[]) ?? []);
      setLoading(false);
    }
    if (msg.type === "applying") setApplying(msg.patchId as string);
    if (msg.type === "applied") setApplying(null);
  }, []);

  const { post } = useVscodeBridge(onMessage);

  return (
    <div className={!init.motionEnabled ? "no-motion" : ""}>
      {loading ? <LoadingSkeleton /> : null}
      {patches.map((p) => (
        <div key={p.id} className={applying === p.id ? animationClasses.patchApplying : ""}>
          <DiffViewerSummary filePath={p.filePath} summary={p.summary} onOpenDiff={() => post("preview", { patchId: p.id })} />
          <div className="toolbar">
            <span className="badge">{p.status}</span>
            <GlowButton onClick={() => post("apply", { patchId: p.id })}>Apply</GlowButton>
            <GlowButton variant="ghost" onClick={() => post("reject", { patchId: p.id })}>Reject</GlowButton>
            <GlowButton variant="danger" onClick={() => post("rollback", { patchId: p.id })}>Rollback</GlowButton>
          </div>
        </div>
      ))}
      {patches.length === 0 && !loading ? <div className="empty">No patches pending</div> : null}
    </div>
  );
}

export default PatchApp;
