"use client";

import dynamic from "next/dynamic";
import { registerGhostTextProvider } from "../../features/editor/ghost-text-provider";
import { registerPrincyMonacoTheme } from "../../features/editor/princy-monaco-theme";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type MonacoEditorPanelProps = {
  path: string;
  value: string;
  onChange?: (value: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onSelectionChange?: (selection: string) => void;
};

export function MonacoEditorPanel({ path, value, onChange, onCursorChange, onSelectionChange }: MonacoEditorPanelProps) {
  const language = path.endsWith(".tsx") || path.endsWith(".ts")
    ? "typescript"
    : path.endsWith(".json")
      ? "json"
      : path.endsWith(".md")
        ? "markdown"
        : "plaintext";

  return (
    <Monaco
      height="100%"
      language={language}
      theme="princy-dark"
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      beforeMount={(monaco) => {
        registerPrincyMonacoTheme(monaco);
        registerGhostTextProvider(monaco, language);
      }}
      onMount={(editor) => {
        editor.onDidChangeCursorPosition((e) => {
          onCursorChange?.(e.position.lineNumber, e.position.column);
        });
        editor.onDidChangeCursorSelection(() => {
          const sel = editor.getModel()?.getValueInRange(editor.getSelection()!) ?? "";
          onSelectionChange?.(sel.trim().length > 2 ? sel : "");
        });
      }}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
        fontFamily: "JetBrains Mono, Fira Code, monospace",
        inlineSuggest: { enabled: true }
      }}
    />
  );
}
