import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ModelRouter } from "./ModelRouter.js";

describe("ModelRouter", () => {
  let router: ModelRouter;

  beforeEach(() => {
    router = new ModelRouter();
    router.resetStats();
  });

  it("routes simple chat to qwen2.5:3b", () => {
    assert.equal(router.routeChat("oi"), "qwen2.5:3b");
  });

  it("routes explain code to qwen2.5:3b", () => {
    assert.equal(router.routeTask("explicar esta função"), "qwen2.5:3b");
  });

  it("routes refactor to qwen3:8b", () => {
    assert.equal(router.routeTask("refatore este componente"), "qwen3:8b");
  });

  it("routes architect tasks to deepseek-r1:8b", () => {
    assert.equal(router.routeTask("planeje uma arquitetura"), "deepseek-r1:8b");
  });

  it("routes swarm agents to deepseek-r1:8b", () => {
    assert.equal(router.routeAgent("ARCHITECT"), "deepseek-r1:8b");
    assert.equal(router.routeAgent("REVIEWER"), "deepseek-r1:8b");
  });

  it("routes autonomous agents to deepseek-r1:8b", () => {
    assert.equal(router.routeAgent("AUTO"), "deepseek-r1:8b");
  });

  it("routes autocomplete to qwen2.5:3b", () => {
    assert.equal(router.routeAutocomplete(), "qwen2.5:3b");
  });

  it("aggregates stats by model family", () => {
    router.routeChat("oi");
    router.routeTask("refatore este componente");
    router.routeTask("planeje uma arquitetura");
    router.recordResponseTime("chat_simple", "qwen2.5:3b", 120, false);
    router.recordResponseTime("refactor", "qwen3:8b", 340, false);
    router.recordResponseTime("architect", "deepseek-r1:8b", 800, true);

    const stats = router.getStats();
    assert.ok(stats.totalRequests >= 6);
    assert.ok(stats.qwen25Requests >= 1);
    assert.ok(stats.qwen3Requests >= 1);
    assert.ok(stats.deepseekRequests >= 1);
    assert.ok(stats.avgResponseTime > 0);
  });
});
