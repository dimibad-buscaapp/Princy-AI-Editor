import {
  DEFAULT_CODE_MODEL,
  DEFAULT_FAST_MODEL,
  DEFAULT_REASONING_MODEL
} from "../config/router.js";
import type { AgentType, RequestType, RouteDecision, SwarmRole } from "./RouteTypes.js";

const EXPLAIN_KEYWORDS = [
  "explain", "explicar", "explica", "document", "documentar", "documentação",
  "what does", "o que faz", "como funciona", "describe", "descrever"
];

const REFACTOR_KEYWORDS = [
  "refactor", "refatorar", "refatore", "melhorar código", "improve code",
  "generate test", "gerar teste", "testes", "component", "componente",
  "complete code", "completar código", "fix code", "corrigir código"
];

const ARCHITECT_KEYWORDS = [
  "architect", "arquitetura", "architecture", "planejar", "planeje", "plan ",
  "design system", "design de", "roadmap", "system design", "estrutura do sistema"
];

const AUTONOMOUS_KEYWORDS = [
  "autonomous", "autônomo", "autonomo", "multi-step", "multi step",
  "executar automaticamente", "run automatically", "execute steps"
];

const SWARM_KEYWORDS = [
  "coordinator", "developer", "tester", "reviewer", "devops", "swarm"
];

export function modelForRequestType(type: RequestType): string {
  switch (type) {
    case "chat_simple":
    case "ghost_text":
    case "explain_code":
      return DEFAULT_FAST_MODEL;
    case "refactor":
      return DEFAULT_CODE_MODEL;
    case "architect":
    case "autonomous":
    case "swarm":
      return DEFAULT_REASONING_MODEL;
    default:
      return DEFAULT_FAST_MODEL;
  }
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export function classifyTask(prompt: string): RequestType {
  const text = prompt.trim();
  if (!text) return "chat_simple";

  if (matchesKeywords(text, ARCHITECT_KEYWORDS)) return "architect";
  if (matchesKeywords(text, AUTONOMOUS_KEYWORDS)) return "autonomous";
  if (matchesKeywords(text, SWARM_KEYWORDS)) return "swarm";
  if (matchesKeywords(text, REFACTOR_KEYWORDS)) return "refactor";
  if (matchesKeywords(text, EXPLAIN_KEYWORDS)) return "explain_code";

  return "chat_simple";
}

export function classifyAgent(agentType: AgentType | SwarmRole | string): RequestType {
  const upper = agentType.toUpperCase();

  switch (upper) {
    case "ARCHITECT":
    case "PLANNER":
    case "RESEARCHER":
    case "CONTEXT_GRAPH":
    case "COORDINATOR":
      return "architect";
    case "REVIEWER":
    case "DEBUGGER":
    case "TESTER":
    case "DEVOPS":
      return "swarm";
    case "AUTO":
    case "TERMINAL":
    case "WRITER":
      return "autonomous";
    case "CODER":
    case "DEVELOPER":
      return "refactor";
    case "MEMORY":
    default:
      return "chat_simple";
  }
}

export function buildDecision(requestType: RequestType, reason?: string): RouteDecision {
  return {
    model: modelForRequestType(requestType),
    requestType,
    reason
  };
}

export function classifyAndRoute(prompt: string): RouteDecision {
  const requestType = classifyTask(prompt);
  return buildDecision(requestType, `task:${requestType}`);
}

export function classifyAgentAndRoute(agentType: AgentType | SwarmRole | string): RouteDecision {
  const requestType = classifyAgent(agentType);
  return buildDecision(requestType, `agent:${agentType}`);
}
