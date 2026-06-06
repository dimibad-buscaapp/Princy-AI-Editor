import { isCodeModel, isFastModel, isReasoningModel } from "../config/router.js";
import {
  buildDecision,
  classifyAgentAndRoute,
  classifyAndRoute,
  modelForRequestType
} from "./RouteRules.js";
import type {
  AgentType,
  RequestType,
  RouteDecision,
  RouterMetricEvent,
  RouterStats,
  SwarmRole
} from "./RouteTypes.js";

export class ModelRouter {
  private decisions: RouterMetricEvent[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;

  routeChat(_message: string): string {
    const model = modelForRequestType("chat_simple");
    this.recordDecision({
      router_decision: "chat_simple",
      selected_model: model,
      request_type: "chat_simple",
      response_time: 0
    });
    return model;
  }

  routeChatDecision(message: string, mode: "fast" | "deep" = "fast"): RouteDecision {
    if (mode === "deep") {
      const decision = buildDecision("architect", "mode:deep");
      this.recordDecision({
        router_decision: decision.requestType,
        selected_model: decision.model,
        request_type: decision.requestType,
        response_time: 0
      });
      return decision;
    }
    const classified = classifyAndRoute(message);
    const model =
      classified.requestType === "chat_simple" || classified.requestType === "explain_code"
        ? modelForRequestType("chat_simple")
        : classified.model;
    const decision: RouteDecision = {
      model,
      requestType: classified.requestType === "chat_simple" ? "chat_simple" : classified.requestType,
      reason: classified.reason
    };
    this.recordDecision({
      router_decision: decision.requestType,
      selected_model: decision.model,
      request_type: decision.requestType,
      response_time: 0
    });
    return decision;
  }

  routeAutocomplete(): string {
    const model = modelForRequestType("ghost_text");
    this.recordDecision({
      router_decision: "ghost_text",
      selected_model: model,
      request_type: "ghost_text",
      response_time: 0
    });
    return model;
  }

  routeTask(prompt: string): string {
    const decision = classifyAndRoute(prompt);
    this.recordDecision({
      router_decision: decision.requestType,
      selected_model: decision.model,
      request_type: decision.requestType,
      response_time: 0
    });
    return decision.model;
  }

  routeTaskDecision(prompt: string): RouteDecision {
    const decision = classifyAndRoute(prompt);
    this.recordDecision({
      router_decision: decision.requestType,
      selected_model: decision.model,
      request_type: decision.requestType,
      response_time: 0
    });
    return decision;
  }

  routeAgent(agentType: AgentType | SwarmRole | string): string {
    const decision = classifyAgentAndRoute(agentType);
    this.recordDecision({
      router_decision: decision.requestType,
      selected_model: decision.model,
      request_type: decision.requestType,
      response_time: 0
    });
    return decision.model;
  }

  routeAgentDecision(agentType: AgentType | SwarmRole | string): RouteDecision {
    const decision = classifyAgentAndRoute(agentType);
    this.recordDecision({
      router_decision: decision.requestType,
      selected_model: decision.model,
      request_type: decision.requestType,
      response_time: 0
    });
    return decision;
  }

  recordDecision(event: RouterMetricEvent): void {
    this.decisions = [event, ...this.decisions].slice(0, 500);
  }

  recordResponseTime(requestType: RequestType, model: string, responseTimeMs: number, cacheHit?: boolean): void {
    this.recordDecision({
      router_decision: requestType,
      selected_model: model,
      request_type: requestType,
      response_time: responseTimeMs
    });
    if (cacheHit === true) this.cacheHits += 1;
    else if (cacheHit === false) this.cacheMisses += 1;
  }

  getStats(): RouterStats {
    const recent = this.decisions.filter((d) => d.response_time >= 0);
    let qwen25 = 0;
    let qwen3 = 0;
    let deepseek = 0;
    const modelCounts = new Map<string, number>();

    for (const d of recent) {
      const model = d.selected_model;
      modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1);
      if (isFastModel(model)) qwen25 += 1;
      else if (isCodeModel(model)) qwen3 += 1;
      else if (isReasoningModel(model)) deepseek += 1;
    }

    const withTime = recent.filter((d) => d.response_time > 0);
    const avgResponseTime =
      withTime.length > 0
        ? Math.round(withTime.reduce((sum, d) => sum + d.response_time, 0) / withTime.length)
        : 0;

    let mostUsedModel: string | undefined;
    let maxCount = 0;
    for (const [model, count] of modelCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostUsedModel = model;
      }
    }

    const cacheTotal = this.cacheHits + this.cacheMisses;
    const cacheHitRatio = cacheTotal > 0 ? Math.round((this.cacheHits / cacheTotal) * 1000) / 10 : undefined;

    return {
      totalRequests: recent.length,
      qwen25Requests: qwen25,
      qwen3Requests: qwen3,
      deepseekRequests: deepseek,
      avgResponseTime,
      mostUsedModel,
      cacheHitRatio
    };
  }

  resetStats(): void {
    this.decisions = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

let sharedRouter: ModelRouter | null = null;

export function getModelRouter(): ModelRouter {
  if (!sharedRouter) sharedRouter = new ModelRouter();
  return sharedRouter;
}

export function routeChat(message: string): string {
  return getModelRouter().routeChat(message);
}

export function routeAutocomplete(): string {
  return getModelRouter().routeAutocomplete();
}

export function routeTask(prompt: string): string {
  return getModelRouter().routeTask(prompt);
}

export function routeAgent(agentType: AgentType | SwarmRole | string): string {
  return getModelRouter().routeAgent(agentType);
}
