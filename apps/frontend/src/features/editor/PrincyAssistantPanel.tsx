"use client";

import { CheckSquare, Lightbulb, Send, Shield, Sparkles } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { GlowButton } from "../../design-system/GlowButton";

const suggestions = [
  "Adicionar rate limiting",
  "Validar tamanho da mensagem",
  "Implementar cache de respostas"
];

export function PrincyAssistantPanel() {
  const [question, setQuestion] = useState("");

  return (
    <aside className="princy-assistant glass-panel luminous-border">
      <header className="princy-assistant__header">
        <Image src="/princy/chat-avatar.png" alt="" width={32} height={32} />
        <h3>PRINCY IA ASSISTANT</h3>
      </header>
      <div className="princy-assistant__section">
        <h4><Shield size={14} /> Análise do Código</h4>
        <p>Este endpoint está implementado corretamente com SSE e streaming do Ollama.</p>
      </div>
      <div className="princy-assistant__section">
        <h4><Lightbulb size={14} /> Sugestões</h4>
        <ul className="princy-assistant__list">
          {suggestions.map((s) => (
            <li key={s} className="princy-assistant__checked">
              <CheckSquare size={14} /> {s}
            </li>
          ))}
        </ul>
      </div>
      <GlowButton
        variant="cyan"
        className="princy-assistant__apply"
        onClick={() => console.info("Aplicar sugestões Princy")}
      >
        <Sparkles size={14} /> Aplicar Sugestões
      </GlowButton>
      <div className="princy-assistant__ask">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pergunte algo sobre este arquivo..."
          rows={2}
        />
        <button type="button" aria-label="Enviar"><Send size={16} /></button>
      </div>
    </aside>
  );
}
