"use client";

import { CheckSquare, Eye, Lightbulb, RotateCcw, Send, Shield, Sparkles, Undo2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { GlowButton } from "../../design-system/GlowButton";
import { useToast } from "../../design-system/Toast";
import { apiFetch } from "../../lib/api-client";
import { DiffViewer } from "./DiffViewer";

const suggestions = [
  "Adicionar rate limiting",
  "Validar tamanho da mensagem",
  "Implementar cache de respostas"
];

type PrincyAssistantPanelProps = {
  projectId: string;
  filePath: string;
  content: string;
};

export function PrincyAssistantPanel({ projectId, filePath, content }: PrincyAssistantPanelProps) {
  const [question, setQuestion] = useState("");
  const [patchId, setPatchId] = useState<string | null>(null);
  const [diffPreview, setDiffPreview] = useState<{ original: string; modified: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const sampleDiff = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,1 +1,2 @@\n ${content.split("\n")[0] ?? ""}\n+// Princy suggestion\n`;

  async function previewPatch() {
    setLoading(true);
    try {
      const res = await apiFetch<{ preview: { original: string; modified: string } }>("/patch/preview", {
        method: "POST",
        body: { projectId, filePath, diff: sampleDiff }
      });
      setDiffPreview(res.preview);
      toast.show("Preview gerado");
    } catch {
      toast.show("Erro no preview do patch");
    } finally {
      setLoading(false);
    }
  }

  async function applyPatch() {
    setLoading(true);
    try {
      const created = await apiFetch<{ patch: { id: string } }>("/patch/create", {
        method: "POST",
        body: { projectId, filePath, diff: sampleDiff }
      });
      setPatchId(created.patch.id);
      await apiFetch("/patch/apply", {
        method: "POST",
        body: { patchId: created.patch.id }
      });
      toast.show("Patch aplicado");
    } catch {
      toast.show("Erro ao aplicar patch");
    } finally {
      setLoading(false);
    }
  }

  async function rollbackPatch() {
    if (!patchId) {
      toast.show("Nenhum patch para reverter");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/patch/rollback", { method: "POST", body: { patchId } });
      toast.show("Patch revertido");
      setPatchId(null);
      setDiffPreview(null);
    } catch {
      toast.show("Erro no rollback");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="princy-assistant ref-panel ref-glow-purple">
      <header className="princy-assistant__header">
        <Image src="/princy/chat-avatar.png" alt="" width={32} height={32} className="chat-msg__avatar" />
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
      <div className="princy-assistant__patch-actions">
        <GlowButton variant="cyan" onClick={previewPatch} disabled={loading}>
          <Eye size={14} /> Preview Patch
        </GlowButton>
        <GlowButton variant="violet" onClick={applyPatch} disabled={loading}>
          <Sparkles size={14} /> Apply Patch
        </GlowButton>
        <GlowButton variant="cyan" onClick={rollbackPatch} disabled={loading || !patchId}>
          <Undo2 size={14} /> Rollback
        </GlowButton>
      </div>
      {diffPreview ? (
        <DiffViewer original={diffPreview.original} modified={diffPreview.modified} height="200px" />
      ) : null}
      <GlowButton variant="violet" className="princy-assistant__apply" onClick={() => toast.show("Sugestões aplicadas")}>
        <RotateCcw size={14} /> Aplicar Sugestões
      </GlowButton>
      <div className="princy-assistant__ask">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pergunte algo sobre este arquivo..."
          rows={2}
        />
        <button
          type="button"
          aria-label="Enviar"
          onClick={() => {
            if (question.trim()) toast.show("Pergunta enviada à Princy IA");
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </aside>
  );
}
