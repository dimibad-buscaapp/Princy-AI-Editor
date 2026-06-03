"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../src/components/auth/protected-route";
import { useAuth } from "../src/context/auth-context";

const services = [
  { name: "Frontend", port: 3400, description: "Interface principal do Princy AI Editor." },
  { name: "API", port: 3401, description: "API central do produto." },
  { name: "Agents", port: 3402, description: "Orquestracao de agentes de IA." },
  { name: "Workspace Service", port: 3403, description: "Projetos, arquivos e sessoes de trabalho." },
  { name: "Context Graph", port: 3404, description: "Grafo de contexto e relacionamentos." },
  { name: "Memory Service", port: 3405, description: "Memoria persistente e recuperacao." },
  { name: "Automation Service", port: 3406, description: "Automacoes e tarefas agendadas." },
  { name: "Gateway", port: 3407, description: "Entrada backend para o frontend." },
  { name: "MCP Server", port: 3408, description: "Servidor MCP para integracoes." },
  { name: "Future", port: 3409, description: "Porta reservada para expansao." }
];

export default function Home() {
  const router = useRouter();
  const { user, logout, sessionMessage } = useAuth();

  return (
    <ProtectedRoute>
      <main className="shell">
        <header className="dashboardHeader">
          <div>
            <p className="eyebrow">Painel</p>
            <h1>Bem-vindo ao Princy AI Editor</h1>
          </div>

          <div className="userBlock">
            <div className="userSummary">
              <p className="userName">{user?.name ?? "Usuário"}</p>
              <p className="userMeta">{user?.email}</p>
              <p className="userMeta">{user?.role ? `Role: ${user.role}` : "Role desconhecida"}</p>
            </div>
            <button
              type="button"
              className="logoutButton"
              onClick={() => {
                logout();
              }}
            >
              Sair
            </button>
          </div>
        </header>

        {sessionMessage ? <div className="sessionBanner">{sessionMessage}</div> : null}

        <section className="hero">
          <p className="eyebrow">Princy AI Editor</p>
          <h1>Editor inteligente com agentes, memoria e automacao.</h1>
          <p className="intro">
            Base inicial do projeto configurada como monorepo TypeScript, pronta para desenvolvimento local,
            Docker e deploy na VPS.
          </p>
        </section>

        <section className="grid" aria-label="Servicos do projeto">
          {services.map((service) => (
            <article className="card" key={service.port}>
              <div className="cardHeader">
                <h2>{service.name}</h2>
                <span>:{service.port}</span>
              </div>
              <p>{service.description}</p>
              {service.port !== 3400 && service.port !== 3409 ? (
                <a href={`http://localhost:${service.port}/health`}>Abrir health check</a>
              ) : null}
            </article>
          ))}
        </section>
      </main>
    </ProtectedRoute>
  );
}
