import { EventEmitter } from "node:events";

export type PrincyEventType =
  | "agent"
  | "patch"
  | "task"
  | "terminal"
  | "memory"
  | "context";

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
    return full;
  }
}

export const eventBus = new EventBusImpl();
