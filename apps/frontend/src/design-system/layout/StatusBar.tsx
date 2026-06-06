"use client";

import { useEffect, useState } from "react";
import { gatewayUrl } from "../../lib/api";
import { princyVersion } from "./nav-items";

export function StatusBar() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch(gatewayUrl("/health/live"))
      .then((r) => setConnected(r.ok))
      .catch(() => setConnected(false));
  }, []);

  return (
    <footer className="princy-statusbar statusbar-glow">
      <div className="princy-statusbar__left">
        <span>Princy AI Editor {princyVersion}</span>
      </div>
      <div className="princy-statusbar__center">
        <span className={`princy-statusbar__dot ${connected ? "princy-statusbar__dot--ok" : ""}`} aria-hidden />
        <span className={connected ? "princy-statusbar__core--ok" : ""}>
          {connected ? "Conectado ao Princy Core" : "Reconectando..."}
        </span>
      </div>
      <p className="princy-statusbar__slogan">O futuro é colaborativo.</p>
    </footer>
  );
}
