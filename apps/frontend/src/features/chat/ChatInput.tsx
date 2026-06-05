"use client";

import { Bot, ChevronDown, Paperclip, Send, Sparkles } from "lucide-react";
import { GlowButton } from "../../design-system/GlowButton";
import { chatModel } from "../../design-system/layout/nav-items";

type ChatInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  thinking: boolean;
  onThinkingChange: (v: boolean) => void;
  disabled?: boolean;
};

export function ChatInput({ value, onChange, onSend, thinking, onThinkingChange, disabled }: ChatInputProps) {
  return (
    <div className="chat-input glass-panel">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite sua mensagem para a Princy IA..."
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <div className="chat-input__toolbar">
        <span className="chat-input__model-chip">
          <Bot size={14} /> Modelo: {chatModel} <ChevronDown size={12} />
        </span>
        <label className="chat-input__thinking">
          <input type="checkbox" checked={thinking} onChange={(e) => onThinkingChange(e.target.checked)} />
          <Sparkles size={14} /> Pensamento
        </label>
        <button type="button" className="chat-input__attach" aria-label="Anexar">
          <Paperclip size={16} /> Anexar
        </button>
        <GlowButton variant="violet" onClick={onSend} disabled={disabled || !value.trim()} className="chat-input__send">
          <Send size={16} />
        </GlowButton>
      </div>
    </div>
  );
}
