"use client";

import Image from "next/image";
import { Bot, MessageSquare, Network, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { HolographicCard } from "../../design-system/HolographicCard";
import { NeuralGlow } from "../../design-system/NeuralGlow";

const activity = [
  { icon: "🧠", text: "Agente Architect finalizou análise do sistema", time: "há 2 min" },
  { icon: "💾", text: "Memória expandida em +128 vetores", time: "há 8 min" },
  { icon: "⚡", text: "Swarm executou 23 tarefas com sucesso", time: "há 15 min" }
];

const features = [
  { title: "CONVERSAÇÃO", desc: "Converse com a Princy IA e obtenha respostas inteligentes.", href: "/chat", icon: <MessageSquare size={20} /> },
  { title: "EDIÇÃO AVANÇADA", desc: "Código com inteligência, sugestões e refatorações automáticas.", href: "/editor/demo", icon: <Bot size={20} /> },
  { title: "SWARM AUTÔNOMO", desc: "Agentes trabalhando juntos para alcançar resultados incríveis.", href: "/swarm", icon: <Network size={20} /> },
  { title: "AUTOMAÇÃO", desc: "Automatize fluxos complexos com facilidade.", href: "/automacoes", icon: <Workflow size={20} /> }
];

export function HomeView() {
  const [metrics, setMetrics] = useState({ tokens: "2.4M", requests: 1842, agents: "8/8", accuracy: "98.7%" });

  useEffect(() => {
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://127.0.0.1:3407";
    const id = setInterval(() => {
      fetch(`${gateway}/metrics`)
        .then((r) => r.text())
        .then((text) => {
          const reqMatch = text.match(/http_requests_total\{[^}]*\}\s+(\d+)/);
          if (reqMatch) setMetrics((m) => ({ ...m, requests: Number(reqMatch[1]) || m.requests }));
        })
        .catch(() => undefined);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="home-view">
      <section className="home-hero glass-panel luminous-border">
        <div className="home-hero__copy">
          <h1 className="home-hero__title">PRINCY AI</h1>
          <p className="home-hero__subtitle">INTELIGÊNCIA QUE EXPANDE A MENTE.</p>
          <p className="home-hero__tagline">
            Plataforma autônoma de desenvolvimento com IA. Colaboração neural entre agentes,
            memória persistente e automação do futuro.
          </p>
        </div>
        <div className="home-hero__visual">
          <NeuralGlow size={300} className="home-hero__glow" />
          <Image src="/princy/hero-alien.png" alt="Princy AI" width={480} height={320} className="home-hero__img" priority />
        </div>
      </section>

      <section className="home-cards">
        {features.map((f) => (
          <HolographicCard key={f.title} href={f.href} className="home-feature-card">
            <div className="home-feature-card__icon">{f.icon}</div>
            <div>
              <h3 className="home-feature-card__title">{f.title}</h3>
              <p className="holo-card__desc">{f.desc}</p>
            </div>
          </HolographicCard>
        ))}
      </section>

      <section className="home-bottom-panel glass-panel luminous-border">
        <div>
          <h2 className="home-section-title">ATIVIDADE RECENTE</h2>
          {activity.map((a) => (
            <div key={a.text} className="home-activity__row">
              <span>{a.icon}</span>
              <span>{a.text}</span>
              <span className="home-activity__time">{a.time}</span>
            </div>
          ))}
        </div>
        <div>
          <h2 className="home-section-title">MÉTRICAS EM TEMPO REAL</h2>
          <div className="home-metrics__row"><span>Tokens Processados</span><strong>{metrics.tokens}</strong></div>
          <div className="home-metrics__row"><span>Requisições Hoje</span><strong>{metrics.requests}</strong></div>
          <div className="home-metrics__row"><span>Agentes Ativos</span><strong>{metrics.agents}</strong></div>
          <div className="home-metrics__row"><span>Precisão Média</span><strong>{metrics.accuracy}</strong></div>
          <div className="home-metrics__chart-wrap">
            <svg viewBox="0 0 200 80" width="100%" height="100%" aria-hidden>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[20, 40, 60].map((y) => (
                <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="rgba(255,255,255,0.06)" />
              ))}
              <polygon fill="url(#areaGrad)" points="0,60 30,55 60,50 90,35 120,40 150,25 180,30 200,20 200,80 0,80" />
              <polyline fill="none" stroke="#a855f7" strokeWidth="2" points="0,60 30,55 60,50 90,35 120,40 150,25 180,30 200,20" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
