"use client";

import { Bell, Circle, Hexagon, Search, Settings, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getPageTitle, princyVersion } from "./nav-items";

export function TopBar() {
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const pageTitle = getPageTitle(pathname);
  const [autonomous, setAutonomous] = useState(false);

  useEffect(() => {
    setAutonomous(pathname.startsWith("/automacoes"));
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const immersive = pathname.startsWith("/chat") || pathname.startsWith("/swarm") || pathname.startsWith("/editor");

  return (
    <header className={`princy-topbar topbar-glass ${immersive ? "princy-topbar--immersive" : ""}`}>
      <span className="princy-topbar__title">{pageTitle}</span>
      <div className="princy-topbar__search">
        <Search size={16} strokeWidth={1.5} />
        <input ref={searchRef} type="search" placeholder="Buscar no Princy..." aria-label="Buscar no Princy" />
        <kbd className="princy-topbar__kbd">Ctrl K</kbd>
      </div>
      <div className="princy-topbar__actions">
        <Link
          href="/automacoes"
          className={`princy-topbar__autonomous ${autonomous ? "princy-topbar__autonomous--active" : ""}`}
        >
          <Zap size={14} />
          AUTONOMOUS MODE
        </Link>
        <span className="princy-topbar__version">
          <span className="princy-topbar__dot" aria-hidden />
          {princyVersion}
        </span>
        <button type="button" className="princy-topbar__icon" aria-label="Notificações">
          <Bell size={17} strokeWidth={1.5} />
        </button>
        <Link href="/swarm" className="princy-topbar__icon" aria-label="Swarm">
          <Hexagon size={17} strokeWidth={1.5} />
        </Link>
        <Link href="/configuracoes" className="princy-topbar__icon" aria-label="Configurações">
          <Settings size={17} strokeWidth={1.5} />
        </Link>
        <button type="button" className="princy-topbar__icon" aria-label="Perfil">
          <Circle size={17} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
