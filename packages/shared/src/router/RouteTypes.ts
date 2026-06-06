export type RequestType =
  | "chat_simple"
  | "ghost_text"
  | "explain_code"
  | "refactor"
  | "architect"
  | "autonomous"
  | "swarm";

export type RouteDecision = {
  model: string;
  requestType: RequestType;
  reason?: string;
};

export type RouterMetricEvent = {
  router_decision: RequestType;
  selected_model: string;
  request_type: RequestType;
  response_time: number;
};

export type RouterStats = {
  totalRequests: number;
  qwen25Requests: number;
  qwen3Requests: number;
  deepseekRequests: number;
  avgResponseTime: number;
  mostUsedModel?: string;
  cacheHitRatio?: number;
};

export type AgentType =
  | "AUTO"
  | "PLANNER"
  | "CODER"
  | "REVIEWER"
  | "DEBUGGER"
  | "ARCHITECT"
  | "TERMINAL"
  | "RESEARCHER"
  | "WRITER"
  | "MEMORY"
  | "CONTEXT_GRAPH";

export type SwarmRole =
  | "COORDINATOR"
  | "ARCHITECT"
  | "DEVELOPER"
  | "TESTER"
  | "REVIEWER"
  | "DEVOPS";
