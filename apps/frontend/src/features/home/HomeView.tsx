"use client";

import Link from "next/link";
import {
  Activity,
  Bot,
  Code2,
  Database,
  FolderOpen,
  MessageSquare,
  Network,
  ShoppingBag,
  Zap
} from "lucide-react";
import { BetaBadge } from "../../design-system/BetaBadge";
import { LoadingSkeleton } from "../../design-system/LoadingSkeleton";
import { ServiceStatusPanel } from "../system/ServiceStatusPanel";
import { useHomeDashboard } from "./use-home-dashboard";
import { useRecentProjects } from "./use-recent-projects";

export function HomeView() {
  const { models, router, swarm, memory, servicesHealthy, servicesTotal, loading, refresh } = useHomeDashboard();
  const { projects } = useRecentProjects();

  return (
    <div className="home-view home-view--beta">
      <section className="home-hero home-hero--beta ref-panel">
        <div className="home-hero__copy">
          <p className="eyebrow">Princy Neural Dark</p>
          <h1 className="home-hero__title">Princy Code Beta</h1>
          <p className="home-hero__subtitle">AI Development Environment</p>
          <p className="home-hero__tagline">
            IDE neural com roteamento automático, swarm multi-agente e memória persistente.
          </p>
          <div className="home-hero__cta-row">
            <Link href="/editor/demo" className="glow-btn glow-btn--cyan">
              <Code2 size={16} /> Start coding
            </Link>
            <Link href="/projetos" className="glow-btn">
              <FolderOpen size={16} /> Open workspace
            </Link>
          </div>
        </div>
        <div className="home-hero__stats">
          <BetaBadge variant="success">{servicesHealthy}/{servicesTotal} online</BetaBadge>
          {router?.mostUsedModel ? (
            <span className="home-hero__stat-muted">Modelo: {router.mostUsedModel}</span>
          ) : null}
        </div>
      </section>

      <section className="beta-grid home-beta-grid">
        <Link href="/editor/demo" className="beta-card home-beta-card">
          <Bot size={20} />
          <p className="beta-card__title">Start coding</p>
          <p className="beta-card__muted">Abrir editor com assistência neural</p>
        </Link>
        <Link href="/projetos" className="beta-card home-beta-card">
          <FolderOpen size={20} />
          <p className="beta-card__title">Open workspace</p>
          <p className="beta-card__muted">Projetos e workspace local</p>
        </Link>
        <div className="beta-card home-beta-card">
          <p className="beta-card__title">Recent projects</p>
          {projects.length === 0 ? (
            <p className="beta-card__muted">Nenhum projeto recente</p>
          ) : (
            <ul className="home-recent-list">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link href={p.href}>{p.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="beta-card home-beta-card">
          <Network size={18} />
          <p className="beta-card__title">Neural Router</p>
          {loading ? (
            <LoadingSkeleton height={40} />
          ) : router ? (
            <>
              <p className="beta-card__value">
                {router.qwen25Requests} fast · {router.qwen3Requests} code · {router.deepseekRequests} reasoning
              </p>
              <p className="beta-card__muted">Avg {router.avgResponseTime}ms</p>
            </>
          ) : (
            <p className="beta-card__muted">Stats indisponíveis</p>
          )}
        </div>

        <div className="beta-card home-beta-card">
          <Zap size={18} />
          <p className="beta-card__title">Active models</p>
          <p className="beta-card__muted">Chat: {models.chat}</p>
          <p className="beta-card__muted">Code: {models.editor}</p>
          <p className="beta-card__muted">Swarm: {models.swarm}</p>
        </div>

        <div className="beta-card home-beta-card">
          <Activity size={18} />
          <p className="beta-card__title">Swarm status</p>
          {swarm ? (
            <>
              <p className="beta-card__value">{swarm.activeAgents}</p>
              <p className="beta-card__muted">Sucesso {swarm.successRate}% · {swarm.avgTime}</p>
            </>
          ) : (
            <p className="beta-card__muted">Aguardando métricas</p>
          )}
        </div>

        <div className="beta-card home-beta-card">
          <Database size={18} />
          <p className="beta-card__title">Memory status</p>
          {memory ? (
            <>
              <p className="beta-card__value">{memory.entries} entradas</p>
              <p className="beta-card__muted">{memory.totalHits} cache hits</p>
            </>
          ) : (
            <p className="beta-card__muted">Cache indisponível</p>
          )}
        </div>

        <Link href="/marketplace" className="beta-card home-beta-card">
          <ShoppingBag size={18} />
          <p className="beta-card__title">Marketplace</p>
          <p className="beta-card__muted">Agentes, tools e extensões</p>
        </Link>

        <Link href="/observability" className="beta-card home-beta-card">
          <MessageSquare size={18} />
          <p className="beta-card__title">Observability</p>
          <p className="beta-card__muted">Métricas e health do sistema</p>
        </Link>
      </section>

      <section className="home-bottom-panel home-bottom-panel--beta">
        <ServiceStatusPanel compact limit={6} />
        <div className="beta-card">
          <h2 className="home-section-title">Atualizar dashboard</h2>
          <p className="beta-card__muted">Dados agregados de health, router, swarm e memory.</p>
          <button type="button" className="glow-btn glow-btn--cyan" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      </section>
    </div>
  );
}
