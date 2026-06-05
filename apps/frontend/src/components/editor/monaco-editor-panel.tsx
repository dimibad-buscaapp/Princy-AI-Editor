"use client";

import dynamic from "next/dynamic";
import { registerPrincyMonacoTheme } from "../../features/editor/princy-monaco-theme";

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
      theme="princy-dark"
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      beforeMount={registerPrincyMonacoTheme}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
        fontFamily: "JetBrains Mono, Fira Code, monospace"
      }}
    />
  );
}
