import type { Monaco } from "@monaco-editor/react";

export function registerPrincyMonacoTheme(monaco: Monaco) {
  monaco.editor.defineTheme("princy-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6b7a99", fontStyle: "italic" },
      { token: "keyword", foreground: "f472b6" },
      { token: "string", foreground: "fb923c" },
      { token: "number", foreground: "3b82f6" },
      { token: "type", foreground: "7000ff" }
    ],
    colors: {
      "editor.background": "#050816",
      "editor.foreground": "#eef4ff",
      "editor.lineHighlightBackground": "#08112088",
      "editor.selectionBackground": "#7000ff44",
      "editorCursor.foreground": "#00f2ff",
      "editorLineNumber.foreground": "#4a5568",
      "editorIndentGuide.background": "#081120"
    }
  });
}
