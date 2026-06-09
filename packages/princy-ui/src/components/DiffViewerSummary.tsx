import { GlowButton } from "./primitives.js";

export type DiffViewerSummaryProps = {
  filePath: string;
  summary?: string;
  onOpenDiff?: () => void;
};

export function DiffViewerSummary({ filePath, summary, onOpenDiff }: DiffViewerSummaryProps) {
  return (
    <div className="diff-summary glass-panel">
      <div className="diff-file">{filePath}</div>
      {summary ? <pre className="diff-preview">{summary.slice(0, 500)}</pre> : null}
      {onOpenDiff ? <GlowButton onClick={onOpenDiff}>Open Diff</GlowButton> : null}
    </div>
  );
}
