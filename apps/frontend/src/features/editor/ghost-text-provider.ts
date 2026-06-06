import type { Monaco } from "@monaco-editor/react";
import { apiUrl } from "../../lib/api";
import { getAccessToken } from "../../lib/token-storage";

export function registerGhostTextProvider(monaco: Monaco, language: string) {
  monaco.languages.registerInlineCompletionsProvider(language, {
    provideInlineCompletions: async (
      model: { getValueInRange: (range: Record<string, number>) => string },
      position: { lineNumber: number; column: number }
    ) => {
      const prefix = model.getValueInRange({
        startLineNumber: Math.max(1, position.lineNumber - 3),
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });
      if (prefix.trim().length < 8) return { items: [] };

      try {
        const token = getAccessToken();
        const res = await fetch(apiUrl("/chat/complete"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ prefix, language })
        });
        if (!res.ok) return { items: [] };
        const data = (await res.json()) as { suggestion?: string };
        if (!data.suggestion) return { items: [] };
        const insertText = data.suggestion.startsWith(prefix)
          ? data.suggestion.slice(prefix.length)
          : data.suggestion;
        return {
          items: [
            {
              insertText,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            }
          ]
        };
      } catch {
        return { items: [] };
      }
    },
    freeInlineCompletions: () => undefined
  });
}
