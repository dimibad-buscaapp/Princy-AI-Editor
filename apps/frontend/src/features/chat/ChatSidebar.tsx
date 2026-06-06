"use client";

import Image from "next/image";
import { Plus, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { GlowButton } from "../../design-system/GlowButton";
import { apiUrl } from "../../lib/api";
import { getAccessToken } from "../../lib/token-storage";
import { type ChatHistoryItem, loadChatHistory, saveChatHistory } from "./chat-history";

type ChatSidebarProps = {
  activeId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  refreshKey?: number;
};

export function ChatSidebar({ activeId, onSelect, onNewChat, refreshKey = 0 }: ChatSidebarProps) {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (token) {
      try {
        const res = await fetch(apiUrl("/chat/conversations"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = (await res.json()) as { conversations: ChatHistoryItem[] };
          if (data.conversations.length) {
            setHistory(data.conversations);
            return;
          }
        }
      } catch {
        /* fallback local */
      }
    }
    setHistory(loadChatHistory());
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const sections = [
    { key: "today" as const, label: "Hoje" },
    { key: "yesterday" as const, label: "Ontem" },
    { key: "older" as const, label: "Anteriores" }
  ];

  const demoItems: ChatHistoryItem[] = [
    { id: "demo-1", title: "Explique computação quântica", section: "today", time: "14:32" },
    { id: "demo-2", title: "Como funciona o Swarm?", section: "today", time: "13:12" },
    { id: "demo-3", title: "Otimize este código Python", section: "today", time: "11:05" },
    { id: "demo-4", title: "Planejar arquitetura", section: "yesterday", time: "Ontem" },
    { id: "demo-5", title: "Análise de logs do sistema", section: "yesterday", time: "Ontem" },
    { id: "demo-6", title: "Gerar documentação", section: "older", time: "3 dias" },
    { id: "demo-7", title: "Explicar Docker", section: "older", time: "5 dias" }
  ];

  const displayHistory = history.length ? history : demoItems;

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar__header">
        <div className="chat-sidebar__title-row">
          <Image src="/princy/chat-avatar.png" alt="" width={28} height={28} className="chat-sidebar__icon" />
          <h2>Chat Princy</h2>
        </div>
        <GlowButton variant="violet" onClick={onNewChat} className="chat-sidebar__new">
          <Plus size={16} /> Novo Chat
        </GlowButton>
      </div>
      {sections.map((section) => {
        const items = displayHistory.filter((h) => h.section === section.key);
        if (!items.length) return null;
        return (
          <div key={section.key} className="chat-sidebar__section">
            <h3>{section.label}</h3>
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={activeId === item.id ? "active" : ""}
                    onClick={() => {
                      saveChatHistory(displayHistory);
                      onSelect(item.id);
                    }}
                  >
                    <span>{item.title}</span>
                    <small>{item.time}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <button type="button" className="chat-sidebar__all">
        <Upload size={14} /> Ver todos os chats
      </button>
    </aside>
  );
}
