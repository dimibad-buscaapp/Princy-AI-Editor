"use client";

import { ChevronDown, ChevronRight, FileCode, FileJson, Folder } from "lucide-react";
import { useState } from "react";
import type { EditorFile } from "./editor-files";

type FileTreeProps = {
  nodes: EditorFile[];
  activePath: string;
  onSelect: (path: string, name: string) => void;
  depth?: number;
};

export function FileTree({ nodes, activePath, onSelect, depth = 0 }: FileTreeProps) {
  return (
    <ul className="file-tree" style={{ paddingLeft: depth ? 12 : 0 }}>
      {nodes.map((node) => (
        <FileTreeNode key={node.path} node={node} activePath={activePath} onSelect={onSelect} depth={depth} />
      ))}
    </ul>
  );
}

function FileTreeNode({
  node,
  activePath,
  onSelect,
  depth
}: {
  node: EditorFile;
  activePath: string;
  onSelect: (path: string, name: string) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isFolder = node.type === "folder";

  if (isFolder) {
    return (
      <li>
        <button type="button" className="file-tree__folder" onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Folder size={14} className="file-tree__icon--folder" />
          {node.name}
        </button>
        {open && node.children ? (
          <FileTree nodes={node.children} activePath={activePath} onSelect={onSelect} depth={depth + 1} />
        ) : null}
      </li>
    );
  }

  const Icon = node.name.endsWith(".json") ? FileJson : FileCode;
  return (
    <li>
      <button
        type="button"
        className={`file-tree__file ${activePath === node.path ? "active" : ""}`}
        onClick={() => onSelect(node.path, node.name)}
      >
        <Icon size={14} className={node.name.endsWith(".json") ? "file-tree__icon--json" : "file-tree__icon--ts"} />
        {node.name}
      </button>
    </li>
  );
}
