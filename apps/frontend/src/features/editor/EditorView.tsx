"use client";

import { AlertCircle, Files, GitBranch, Puzzle, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MonacoEditorPanel } from "../../components/editor/monaco-editor-panel";
import { FileTree } from "./FileTree";
import { editorSnippets, editorTree, openTabs } from "./editor-files";
import { PrincyAssistantPanel } from "./PrincyAssistantPanel";

export function EditorView({ projectId }: { projectId: string }) {
  const [activeFile, setActiveFile] = useState("chat.routes.ts");
  const [tabs, setTabs] = useState(openTabs);
  const [contents, setContents] = useState<Record<string, string>>(editorSnippets);
  const [panelTab, setPanelTab] = useState<"terminal" | "output" | "problems">("terminal");
  const [activePath, setActivePath] = useState("services/agents/src/routes/chat.routes.ts");

  const breadcrumbs = useMemo(() => activePath.split("/"), [activePath]);

  function selectFile(path: string, name: string) {
    setActivePath(path);
    setActiveFile(name);
    if (!tabs.includes(name)) setTabs((t) => [...t, name]);
    if (!contents[name]) setContents((c) => ({ ...c, [name]: `// ${name}\n` }));
  }

  return (
    <div className="princy-editor" data-project={projectId}>
      <aside className="princy-editor__activity">
        <button type="button" title="Explorer" className="active"><Files size={18} strokeWidth={1.5} /></button>
        <button type="button" title="Search"><Search size={18} strokeWidth={1.5} /></button>
        <button type="button" title="Git"><GitBranch size={18} strokeWidth={1.5} /></button>
        <button type="button" title="Extensions"><Puzzle size={18} strokeWidth={1.5} /></button>
      </aside>
      <aside className="princy-editor__explorer glass-panel">
        <p className="princy-editor__label">EXPLORADOR</p>
        <p className="princy-editor__project">PRINCY-AI-EDITOR</p>
        <FileTree nodes={editorTree} activePath={activePath} onSelect={selectFile} />
      </aside>
      <section className="princy-editor__main">
        <div className="princy-editor__tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`princy-editor__tab ${activeFile === tab ? "active" : ""}`}
              onClick={() => setActiveFile(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="princy-editor__breadcrumbs">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb}-${i}`}>{crumb}{i < breadcrumbs.length - 1 ? " › " : ""}</span>
          ))}
        </div>
        <div className="princy-editor__code">
          <MonacoEditorPanel
            path={activeFile}
            value={contents[activeFile] ?? ""}
            onChange={(v) => setContents((c) => ({ ...c, [activeFile]: v }))}
          />
        </div>
        <div className="princy-editor__bottom glass-panel">
          {(["terminal", "output", "problems"] as const).map((tab) => (
            <button key={tab} type="button" className={panelTab === tab ? "active" : ""} onClick={() => setPanelTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <pre className="princy-editor__panel-out">Princy workspace ready. Neural link active.</pre>
        </div>
        <footer className="princy-editor__status">
          <span><GitBranch size={12} /> main</span>
          <span><RefreshCw size={12} /></span>
          <span><AlertCircle size={12} /> 0</span>
          <span>⚠ 0</span>
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>LF</span>
          <span>TypeScript</span>
          <span>Prettier ✓</span>
        </footer>
      </section>
      <PrincyAssistantPanel />
    </div>
  );
}
