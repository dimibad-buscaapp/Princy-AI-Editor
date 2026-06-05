"use client";

import { Bell, Circle, Hexagon, Search, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getPageTitle, princyVersion } from "./nav-items";

export function TopBar() {
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const pageTitle = getPageTitle(pathname);

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

  return (
    <header className="princy-topbar topbar-glass">
      <span className="princy-topbar__title">{pageTitle}</span>
      <div className="princy-topbar__search">
        <Search size={16} strokeWidth={1.5} />
        <input ref={searchRef} type="search" placeholder="Buscar no Princy..." aria-label="Buscar no Princy" />
        <kbd className="princy-topbar__kbd">Ctrl K</kbd>
      </div>
      <div className="princy-topbar__actions">
        <span className="princy-topbar__version">
          <span className="princy-topbar__dot" aria-hidden />
          {princyVersion}
        </span>
        <button type="button" className="princy-topbar__icon" aria-label="Notificações">
          <Bell size={17} strokeWidth={1.5} />
        </button>
        <button type="button" className="princy-topbar__icon" aria-label="Swarm">
          <Hexagon size={17} strokeWidth={1.5} />
        </button>
        <button type="button" className="princy-topbar__icon" aria-label="Configurações">
          <Settings size={17} strokeWidth={1.5} />
        </button>
        <button type="button" className="princy-topbar__icon" aria-label="Perfil">
          <Circle size={17} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
