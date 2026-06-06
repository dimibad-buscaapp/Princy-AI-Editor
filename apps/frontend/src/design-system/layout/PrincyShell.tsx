"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isReferenceLocked } from "../princy-visual-mode";
import { ParticleField } from "../ParticleField";
import { RefOverlay } from "../RefOverlay";
import { PrincySidebar } from "../../layout/PrincySidebar";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";

type PrincyShellProps = {
  children: ReactNode;
};

function shellClass(pathname: string): string {
  const classes = ["princy-shell", "neural-bg"];
  if (!isReferenceLocked()) return classes.join(" ");

  if (pathname.startsWith("/chat") || pathname.startsWith("/swarm")) {
    classes.push("ref-shell--immersive");
  }
  if (pathname.startsWith("/editor")) {
    classes.push("ref-shell--immersive", "ref-shell--no-status");
  }
  return classes.join(" ");
}

export function PrincyShell({ children }: PrincyShellProps) {
  const pathname = usePathname();
  const locked = isReferenceLocked();

  return (
    <div className={shellClass(pathname)}>
      {locked ? <div className="particle-field particle-field--dim" aria-hidden /> : <ParticleField />}
      <Suspense fallback={null}>
        <RefOverlay />
      </Suspense>
      {locked ? <PrincySidebar /> : null}
      <div className="princy-shell__main">
        <TopBar />
        <main className="princy-shell__content">{children}</main>
        <StatusBar />
      </div>
    </div>
  );
}
