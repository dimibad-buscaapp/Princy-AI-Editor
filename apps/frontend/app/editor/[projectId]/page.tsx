"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ProtectedRoute } from "../../../src/components/auth/protected-route";
import { EditorLayout } from "../../../src/components/editor/editor-layout";
import { MonacoEditorPanel } from "../../../src/components/editor/monaco-editor-panel";

export default function EditorPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId ?? "demo";
  const [content, setContent] = useState("// Princy AI Editor\n");
  const [activeFile, setActiveFile] = useState("welcome.ts");

  return (
    <ProtectedRoute>
      <EditorLayout
        projectId={projectId}
        sidebar={
          <ul className="explorer-list">
            {["welcome.ts", "README.md", "package.json"].map((file) => (
              <li key={file}>
                <button type="button" onClick={() => setActiveFile(file)}>
                  {file}
                </button>
              </li>
            ))}
          </ul>
        }
        editor={
          <div className="editor-tabs">
            <div className="tab active">{activeFile}</div>
            <div className="editor-area">
              <MonacoEditorPanel path={activeFile} value={content} onChange={setContent} />
            </div>
          </div>
        }
        panel={
          <div className="panel-tabs">
            <span>Terminal</span>
            <span>Problems</span>
            <span>Output</span>
            <pre className="panel-output">Princy workspace ready.</pre>
          </div>
        }
      />
    </ProtectedRoute>
  );
}
