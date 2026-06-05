import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Brain,
  FolderKanban,
  Home,
  MessageSquare,
  Network,
  Settings,
  Terminal,
  Workflow,
  Zap
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  pageTitle: string;
};

export const navItems: NavItem[] = [
  { label: "Início", href: "/", icon: Home, pageTitle: "INDEX" },
  { label: "Chat Princy", href: "/chat", icon: MessageSquare, pageTitle: "CHAT PRINCY" },
  { label: "Editor", href: "/editor/demo", icon: Terminal, pageTitle: "EDITOR" },
  { label: "Swarm", href: "/swarm", icon: Network, pageTitle: "SWARM" },
  { label: "Observability", href: "/observability", icon: Zap, pageTitle: "OBSERVABILITY" },
  { label: "Projetos", href: "/projetos", icon: FolderKanban, pageTitle: "PROJETOS" },
  { label: "Memória", href: "/memoria", icon: Brain, pageTitle: "MEMÓRIA" },
  { label: "Automações", href: "/automacoes", icon: Workflow, pageTitle: "AUTOMAÇÕES" },
  { label: "MCP", href: "/mcp", icon: Bot, pageTitle: "MCP" },
  { label: "Configurações", href: "/configuracoes", icon: Settings, pageTitle: "CONFIGURAÇÕES" }
];

export function getPageTitle(pathname: string) {
  if (pathname.startsWith("/editor")) return "EDITOR";
  const item = navItems.find((n) => n.href === pathname || (n.href !== "/" && pathname.startsWith(n.href)));
  return item?.pageTitle ?? "PRINCY AI";
}

export const princyVersion = process.env.NEXT_PUBLIC_PRINCY_VERSION ?? "v2.5.0";
export const chatModel = process.env.NEXT_PUBLIC_CHAT_MODEL ?? "qwen3:8b";
