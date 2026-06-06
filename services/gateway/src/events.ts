import type { Express, Request, Response } from "express";
import { eventBus, subscribeRedisEvents } from "@princy/event-bus";

function handleEventStream(request: Request, response: Response) {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no");
    if (typeof response.flushHeaders === "function") {
      response.flushHeaders();
    }

    const send = (event: unknown) => {
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const localListener = (event: unknown) => send(event);
    eventBus.on("event", localListener);

    let redisCleanup: (() => void | Promise<void>) | undefined;
    void subscribeRedisEvents((event) => send(event))
      .then((cleanup) => {
        redisCleanup = cleanup;
      })
      .catch(() => undefined);

    send({ type: "agent", name: "stream.connected", payload: { ok: true }, timestamp: new Date().toISOString() });

    request.on("close", () => {
      eventBus.off("event", localListener);
      void redisCleanup?.();
    });
}

export function registerGatewayEventsRoute(app: Express) {
  app.get("/events/stream", handleEventStream);
  app.get("/api/events/stream", handleEventStream);
}
