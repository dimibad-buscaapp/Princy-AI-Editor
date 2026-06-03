"use client";

import { ProtectedRoute } from "../../src/components/auth/protected-route";

const agents = [
  { id: "planner", label: "Planner", status: "idle" },
  { id: "coder", label: "Coder", status: "running" },
  { id: "reviewer", label: "Reviewer", status: "completed" }
];

export default function SwarmPage() {
  return (
    <ProtectedRoute>
      <main className="swarm-page">
        <h1>Swarm Visual</h1>
        <div className="swarm-canvas">
          {agents.map((agent, index) => (
            <div key={agent.id} className={`swarm-node swarm-node--${agent.status}`} style={{ left: `${20 + index * 30}%`, top: "40%" }}>
              <span>{agent.label}</span>
              <small>{agent.status}</small>
              {index < agents.length - 1 ? <div className="swarm-link swarm-link--pulse" /> : null}
            </div>
          ))}
        </div>
        <section className="swarm-timeline">
          <h2>Timeline</h2>
          <ul>
            <li>Planner → plan created</li>
            <li>Coder → patch proposed</li>
            <li>Reviewer → awaiting approval</li>
          </ul>
        </section>
      </main>
    </ProtectedRoute>
  );
}
