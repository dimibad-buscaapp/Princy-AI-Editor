"use client";

import Image from "next/image";
import Link from "next/link";
import { Bot, Brain, Database, MessageSquare, Network, Workflow, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { gatewayUrl } from "../../lib/api";

const activity = [
  { icon: Brain, text: "Agente Architect finalizou análise do sistema", time: "há 2 min" },
  { icon: Database, text: "Memória expandida em +128 vetores", time: "há 5 min" },
  { icon: Zap, text: "Swarm executou 23 tarefas com sucesso", time: "há 12 min" }
];

const features = [
  { title: "CONVERSAÇÃO", desc: "Converse com a Princy IA e obtenha respostas inteligentes.", href: "/chat", icon: MessageSquare },
  { title: "EDIÇÃO AVANÇADA", desc: "Código com inteligência, sugestões e refatorações automáticas.", href: "/editor/demo", icon: Bot },
  { title: "SWARM AUTÔNOMO", desc: "Agentes trabalhando juntos para alcançar resultados incríveis.", href: "/swarm", icon: Network },
  { title: "AUTOMAÇÃO", desc: "Automatize fluxos complexos com facilidade.", href: "/automacoes", icon: Workflow }
];

export function HomeView() {
  const [metrics, setMetrics] = useState({ tokens: "2.4M", requests: 1842, agents: "10/10", accuracy: "98.7%" });

  useEffect(() => {
    const load = () => {
      fetch(gatewayUrl("/api/system/health"))
        .then((r) => r.json())
        .then((data: { neuralCore?: { agentsOnline?: string }; metrics?: { requestsToday?: number; tokens?: string; accuracy?: string } }) => {
          setMetrics((m) => ({
            tokens: data.metrics?.tokens ?? m.tokens,
            requests: data.metrics?.requestsToday ?? m.requests,
            agents: data.neuralCore?.agentsOnline ?? m.agents,
            accuracy: data.metrics?.accuracy ?? m.accuracy
          }));
        })
        .catch(() => undefined);
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="home-view">
      <section className="home-hero ref-panel ref-glow-purple">
        <Image src="/princy/hero-alien.png" alt="" width={120} height={80} className="home-hero__ufo" aria-hidden />
        <div className="home-hero__copy">
          <h1 className="home-hero__title">PRINCY AI</h1>
          <p className="home-hero__subtitle">INTELIGÊNCIA QUE EXPANDE A MENTE</p>
          <p className="home-hero__tagline">
            Sua IA autônoma, colaborativa e evolutiva. Construa, orquestre e automatize qualquer ideia.
          </p>
        </div>
        <div className="home-hero__visual">
          <Image src="/princy/hero-alien.png" alt="Princy AI" width={480} height={320} className="home-hero__img" priority />
        </div>
      </section>

      <section className="home-cards">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Link key={f.title} href={f.href} className="home-feature-card ref-panel">
              <div className="home-feature-card__icon ref-glow-cyan">
                <Icon size={18} />
              </div>
              <div>
                <h3 className="home-feature-card__title">{f.title}</h3>
                <p className="home-feature-card__desc">{f.desc}</p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="home-bottom-panel ref-panel">
        <div>
          <h2 className="home-section-title">ATIVIDADE RECENTE</h2>
          {activity.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.text} className="home-activity__row">
                <span className="home-activity__icon"><Icon size={14} /></span>
                <span>{a.text}</span>
                <span className="home-activity__time">{a.time}</span>
              </div>
            );
          })}
        </div>
        <div>
          <h2 className="home-section-title">MÉTRICAS EM TEMPO REAL</h2>
          <div className="home-metrics__row"><span>Tokens Processados</span><strong>{metrics.tokens}</strong></div>
          <div className="home-metrics__row"><span>Requisições Hoje</span><strong>{metrics.requests.toLocaleString("pt-BR")}</strong></div>
          <div className="home-metrics__row"><span>Agentes Ativos</span><strong>{metrics.agents}</strong></div>
          <div className="home-metrics__row"><span>Precisão Média</span><strong>{metrics.accuracy}</strong></div>
          <div className="home-metrics__chart-wrap">
            <svg viewBox="0 0 200 80" width="100%" height="100%" aria-hidden>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon fill="url(#areaGrad)" points="0,60 30,55 60,50 90,35 120,40 150,25 180,30 200,20 200,80 0,80" />
              <polyline fill="none" stroke="#8b5cf6" strokeWidth="2" points="0,60 30,55 60,50 90,35 120,40 150,25 180,30 200,20" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
