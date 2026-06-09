import { useState, useCallback } from "react";
import { useVscodeBridge, useInitState } from "../hooks/useVscodeBridge.js";
import { HolographicCard, GlowButton, LoadingSkeleton } from "../components/primitives.js";
import { DiffViewerSummary } from "../components/DiffViewerSummary.js";

type Step = { phase: string; status: string; message?: string };
type Approval = { id: string; description: string; patchId?: string; filePath?: string };

function AutonomousApp() {
  const init = useInitState();
  const [objective, setObjective] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [running, setRunning] = useState(false);

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "step") setSteps((prev) => [...prev, msg.step as Step]);
    if (msg.type === "steps") setSteps(msg.steps as Step[]);
    if (msg.type === "approvals") setApprovals(msg.approvals as Approval[]);
    if (msg.type === "running") setRunning(msg.value as boolean);
    if (msg.type === "done") setRunning(false);
  }, []);

  const { post } = useVscodeBridge(onMessage);

  return (
    <div className={`panel-body ${!init.motionEnabled ? "no-motion" : ""}`}>
      <HolographicCard title="Autonomous Mode">
        <textarea rows={3} style={{ width: "100%", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: 8 }} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Goal..." />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <GlowButton onClick={() => post("run", { objective })} disabled={running}>Run</GlowButton>
          <GlowButton variant="danger" onClick={() => post("cancel")} disabled={!running}>Cancel</GlowButton>
        </div>
      </HolographicCard>
      <h3 style={{ color: "var(--violet)", fontSize: 13 }}>Pipeline</h3>
      <div className="timeline">
        {steps.map((s, i) => (
          <div key={i} className="timeline-item">
            <strong>{s.phase}</strong> — <span className={`status-${s.status}`}>{s.status}</span>
            {s.message ? <div>{s.message}</div> : null}
          </div>
        ))}
      </div>
      {approvals.map((a) => (
        <DiffViewerSummary key={a.id} filePath={a.filePath ?? a.description} onOpenDiff={() => a.patchId && post("previewPatch", { patchId: a.patchId })} />
      ))}
      {approvals.map((a) => (
        <div key={`act-${a.id}`} className="toolbar">
          <GlowButton onClick={() => post("approve", { id: a.id })}>Approve</GlowButton>
          <GlowButton variant="danger" onClick={() => post("reject", { id: a.id })}>Reject</GlowButton>
        </div>
      ))}
      {running ? <LoadingSkeleton lines={2} /> : null}
    </div>
  );
}

export default AutonomousApp;
