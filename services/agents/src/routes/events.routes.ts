import type { Express, Request, Response } from "express";
import { eventBus } from "@princy/event-bus";

export function registerEventsRoutes(app: Express) {
  app.get("/events/stream", (request: Request, response: Response) => {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");

    const listener = (event: unknown) => {
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    eventBus.on("event", listener);
    request.on("close", () => {
      eventBus.off("event", listener);
    });
  });
}
