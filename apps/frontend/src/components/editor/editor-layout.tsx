"use client";

import type { ReactNode } from "react";

type EditorLayoutProps = {
  projectId: string;
  sidebar: ReactNode;
  editor: ReactNode;
  panel?: ReactNode;
};

export function EditorLayout({ projectId, sidebar, editor, panel }: EditorLayoutProps) {
  return (
    <div className="editor-shell" data-project={projectId}>
      <aside className="editor-activity-bar">
        <span title="Explorer">📁</span>
        <span title="Search">🔍</span>
        <span title="Git">⎇</span>
        <span title="Extensions">🧩</span>
      </aside>
      <aside className="editor-sidebar">{sidebar}</aside>
      <main className="editor-main">{editor}</main>
      {panel ? <section className="editor-panel">{panel}</section> : null}
    </div>
  );
}
