import cors from "cors";
import dotenv from "dotenv";
import express, { type Express, type Request, type Response } from "express";

export type ServiceRouteRegistrar = (app: Express) => void;

export type ServiceDefinition = {
  name: string;
  description: string;
  port: number;
  routes?: ServiceRouteRegistrar[];
};

export function startService({ name, description, port, routes = [] }: ServiceDefinition) {
  dotenv.config();

  const app = express();
  const startedAt = new Date().toISOString();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.get("/", (_request: Request, response: Response) => {
    response.json({
      service: name,
      description,
      status: "online",
      health: "/health"
    });
  });

  app.get("/health", (_request: Request, response: Response) => {
    response.json({
      service: name,
      status: "ok",
      port,
      startedAt
    });
  });

  for (const registerRoutes of routes) {
    registerRoutes(app);
  }

  const host = process.env.HOST ?? "0.0.0.0";
  app.listen(port, host, () => {
    console.log(`${name} listening at http://${host}:${port}`);
  });

  return app;
}
