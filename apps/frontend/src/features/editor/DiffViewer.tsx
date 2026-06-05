"use client";

import dynamic from "next/dynamic";

const DiffEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.DiffEditor),
  { ssr: false }
);

type DiffViewerProps = {
  original: string;
  modified: string;
  language?: string;
  height?: string;
};

export function DiffViewer({ original, modified, language = "typescript", height = "280px" }: DiffViewerProps) {
  return (
    <div className="princy-diff-viewer glass-panel luminous-border">
      <DiffEditor
        height={height}
        language={language}
        theme="princy-dark"
        original={original}
        modified={modified}
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "JetBrains Mono, Fira Code, monospace"
        }}
      />
    </div>
  );
}
