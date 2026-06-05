import { EventEmitter } from "node:events";

export type PrincyEventType =
  | "agent"
  | "patch"
  | "task"
  | "terminal"
  | "memory"
  | "context"
  | "automation";

export type PrincyEvent = {
  type: PrincyEventType;
  name: string;
  payload: unknown;
  timestamp: string;
};

class EventBusImpl extends EventEmitter {
  publish(event: Omit<PrincyEvent, "timestamp">) {
    const full: PrincyEvent = { ...event, timestamp: new Date().toISOString() };
    this.emit("event", full);
    this.emit(event.type, full);
    void import("./redis-bridge.js").then(({ publishToRedis }) => publishToRedis(full)).catch(() => undefined);
    return full;
  }
}

export const eventBus = new EventBusImpl();

export { initRedisPublisher, subscribeRedisEvents, pingRedis, REDIS_CHANNEL } from "./redis-bridge.js";
