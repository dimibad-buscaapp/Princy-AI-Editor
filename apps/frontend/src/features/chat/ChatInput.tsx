"use client";

import { Bot, ChevronDown, Paperclip, Send, Sparkles } from "lucide-react";
import { GlowButton } from "../../design-system/GlowButton";
import { CHAT_AGENT_OPTIONS } from "./chat-agents";

type ChatInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  thinking: boolean;
  onThinkingChange: (v: boolean) => void;
  agentType: string;
  onAgentTypeChange: (v: string) => void;
  routedModel: string;
  disabled?: boolean;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  thinking,
  onThinkingChange,
  agentType,
  onAgentTypeChange,
  routedModel,
  disabled
}: ChatInputProps) {
  return (
    <div className="chat-input">
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
        <span className="chat-input__model-chip chat-input__model-chip--routed" title="Modelo roteado automaticamente">
          <Bot size={14} />
          <span>{routedModel}</span>
        </span>
        <label className="chat-input__model-chip chat-input__agent-chip">
          <select value={agentType} onChange={(e) => onAgentTypeChange(e.target.value)} aria-label="Agente">
            {CHAT_AGENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={12} />
        </label>
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
