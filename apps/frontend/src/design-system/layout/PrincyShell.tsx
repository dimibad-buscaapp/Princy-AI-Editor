"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ParticleField } from "../ParticleField";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";

type PrincyShellProps = {
  children: ReactNode;
};

export function PrincyShell({ children }: PrincyShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1280px)");
    const apply = () => setCollapsed(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="princy-shell neural-bg">
      <ParticleField />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="princy-shell__main">
        <TopBar />
        <main className="princy-shell__content">{children}</main>
        <StatusBar />
      </div>
    </div>
  );
}
