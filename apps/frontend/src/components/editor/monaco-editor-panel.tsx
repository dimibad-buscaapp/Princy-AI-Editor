"use client";

import dynamic from "next/dynamic";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type MonacoEditorPanelProps = {
  path: string;
  value: string;
  onChange?: (value: string) => void;
};

export function MonacoEditorPanel({ path, value, onChange }: MonacoEditorPanelProps) {
  const language = path.endsWith(".tsx") || path.endsWith(".ts")
    ? "typescript"
    : path.endsWith(".json")
      ? "json"
      : "javascript";

  return (
    <Monaco
      height="100%"
      language={language}
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true
      }}
    />
  );
}
