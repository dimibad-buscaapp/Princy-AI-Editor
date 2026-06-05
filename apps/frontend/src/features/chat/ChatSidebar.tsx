"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { GlowButton } from "../../design-system/GlowButton";
import { type ChatHistoryItem, loadChatHistory } from "./chat-history";

type ChatSidebarProps = {
  activeId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
};

export function ChatSidebar({ activeId, onSelect, onNewChat }: ChatSidebarProps) {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadChatHistory());
  }, []);

  const sections = [
    { key: "today" as const, label: "Hoje" },
    { key: "yesterday" as const, label: "Ontem" },
    { key: "older" as const, label: "Anteriores" }
  ];

  return (
    <aside className="chat-sidebar glass-panel">
      <div className="chat-sidebar__header">
        <div className="chat-sidebar__title-row">
          <Image src="/princy/chat-avatar.png" alt="" width={24} height={24} className="chat-sidebar__icon" />
          <h2>Chat Princy</h2>
        </div>
        <GlowButton variant="violet" onClick={onNewChat} className="chat-sidebar__new">
          <Plus size={16} /> Novo Chat
        </GlowButton>
      </div>
      {sections.map((section) => {
        const items = history.filter((h) => h.section === section.key);
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
                    onClick={() => onSelect(item.id)}
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
      <button type="button" className="chat-sidebar__all">Ver todos os chats</button>
    </aside>
  );
}
