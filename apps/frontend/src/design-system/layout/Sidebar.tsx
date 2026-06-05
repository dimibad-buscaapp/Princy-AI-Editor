"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/auth-context";
import { StatusBadge } from "../StatusBadge";
import { UserAvatar } from "../UserAvatar";
import { navItems } from "./nav-items";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <motion.aside
      className="princy-sidebar"
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
    >
      <div className="princy-sidebar__header">
        {!collapsed ? (
          <div className="princy-sidebar__brand">
            <Image src="/princy/logo-alien.png" alt="" width={32} height={32} className="princy-sidebar__logo" />
            <span className="princy-sidebar__name">PRINCY AI</span>
          </div>
        ) : (
          <Image src="/princy/logo-alien.png" alt="Princy" width={32} height={32} className="princy-sidebar__logo" />
        )}
        <button type="button" className="princy-sidebar__toggle" onClick={onToggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="princy-sidebar__nav">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href.startsWith("/editor")
                ? pathname.startsWith("/editor")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`princy-sidebar__link ${active ? "princy-sidebar__link--active" : ""}`} title={item.label}>
              <Icon size={18} strokeWidth={1.5} />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="princy-sidebar__footer">
        <div className="princy-sidebar__user">
          <UserAvatar name={user?.name ?? user?.email} email={user?.email} size={36} />
          {!collapsed ? (
            <div>
              <p className="princy-sidebar__username">{user?.name ?? "Usuário"}</p>
              <p className="princy-sidebar__email">{user?.email}</p>
            </div>
          ) : null}
        </div>
        {!collapsed ? <StatusBadge label="Online" /> : null}
      </div>
    </motion.aside>
  );
}
