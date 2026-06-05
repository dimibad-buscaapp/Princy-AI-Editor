"use client";

import { Search, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { apiFetch } from "../../lib/api-client";

type GraphNode = { id: string; label: string; type?: string };
type GraphEdge = { id: string; source: string; target: string; label?: string };

export function ContextGraphView() {
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("demo");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
        `/api/context/graph?projectId=${encodeURIComponent(projectId)}`
      );
      const flowNodes: Node[] = (data.nodes ?? []).map((n, i) => ({
        id: n.id,
        data: { label: n.label },
        position: { x: (i % 5) * 180, y: Math.floor(i / 5) * 100 },
        className: "graph-node glass-panel"
      }));
      const flowEdges: Edge[] = (data.edges ?? []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        className: "graph-edge"
      }));
      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch {
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, setNodes, setEdges]);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  async function searchSymbols() {
    if (!query.trim()) return;
    const data = await apiFetch<{ nodes: GraphNode[] }>("/api/context/search", {
      method: "POST",
      body: { projectId, query }
    });
    const hits = new Set((data.nodes ?? []).map((n) => n.id));
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        className: hits.has(n.id) ? "graph-node graph-node--hit" : "graph-node glass-panel"
      }))
    );
  }

  const nodeCount = useMemo(() => nodes.length, [nodes]);

  return (
    <div className="graph-view">
      <header className="graph-view__header glass-panel luminous-border">
        <h1><Zap size={18} /> Context Graph</h1>
        <p>{nodeCount} símbolos indexados — dependências e impactos do monorepo.</p>
        <div className="graph-view__toolbar">
          <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="projectId" />
          <div className="graph-view__search">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar símbolo..." onKeyDown={(e) => e.key === "Enter" && searchSymbols()} />
          </div>
          <button type="button" onClick={() => void loadGraph()} disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </div>
      </header>
      <div className="graph-view__canvas glass-panel luminous-border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1a1035" gap={20} />
          <MiniMap nodeColor="#00f2ff" maskColor="rgba(10,5,25,0.8)" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
