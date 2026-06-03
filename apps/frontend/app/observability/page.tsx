"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "../../src/components/auth/protected-route";

export default function ObservabilityPage() {
  const [metrics, setMetrics] = useState("");

  useEffect(() => {
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://127.0.0.1:3407";
    fetch(`${gateway}/metrics`)
      .then((r) => r.text())
      .then(setMetrics)
      .catch(() => setMetrics("Metrics unavailable"));
  }, []);

  return (
    <ProtectedRoute>
      <main className="observability-page">
        <h1>Health Dashboard</h1>
        <pre>{metrics}</pre>
      </main>
    </ProtectedRoute>
  );
}
