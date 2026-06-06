"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/auth-context";
import { StatusBadge } from "../design-system/StatusBadge";
import { UserAvatar } from "../design-system/UserAvatar";
import { navItems } from "../design-system/layout/nav-items";

const OFFICIAL_HREFS = new Set([
  "/",
  "/chat",
  "/editor/demo",
  "/swarm",
  "/observability",
  "/projetos",
  "/memoria",
  "/automacoes",
  "/mcp",
  "/configuracoes"
]);

const sidebarItems = navItems.filter((item) => OFFICIAL_HREFS.has(item.href));

export function PrincySidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="princy-sidebar">
      <div className="princy-sidebar__header">
        <div className="princy-sidebar__brand">
          <Image src="/princy/logo-alien.png" alt="" width={28} height={28} className="princy-sidebar__logo" />
          <span className="princy-sidebar__name">PRINCY AI</span>
        </div>
      </div>

      <nav className="princy-sidebar__nav">
        {sidebarItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href.startsWith("/editor")
                ? pathname.startsWith("/editor")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`princy-sidebar__link ${active ? "princy-sidebar__link--active" : ""}`}
              title={item.label}
            >
              <Icon size={16} strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="princy-sidebar__footer">
        <div className="princy-sidebar__user">
          <UserAvatar name={user?.name ?? user?.email ?? "Usuário"} email={user?.email} size={32} />
          <div>
            <p className="princy-sidebar__username">{user?.name ?? "Usuário"}</p>
            <p className="princy-sidebar__email">{user?.email ?? ""}</p>
          </div>
        </div>
        <StatusBadge label="Online" />
      </div>
    </aside>
  );
}
