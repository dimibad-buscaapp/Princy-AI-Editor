import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import dotenv from "dotenv";
import express, {
  type ErrorRequestHandler,
  type Express,
  type NextFunction,
  type Request,
  type Response
} from "express";
import helmet from "helmet";
import pino, { type Logger } from "pino";

export type ServiceRouteRegistrar = (app: Express) => void;
export type ServiceReadinessCheck = () => boolean | Promise<boolean>;

export type ServiceDefinition = {
  name: string;
  description: string;
  port: number;
  preRoutes?: ServiceRouteRegistrar[];
  routes?: ServiceRouteRegistrar[];
  readinessCheck?: ServiceReadinessCheck;
};

type HealthStatus = "healthy" | "unhealthy";

let processHandlersRegistered = false;

function serviceSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function resolveLogDirectory() {
  return process.env.PRINCY_LOG_DIR ?? process.env.LOG_DIR ?? path.join(process.env.INIT_CWD ?? process.cwd(), "logs");
}

function createLogger(name: string) {
  const logsPath = resolveLogDirectory();
  fs.mkdirSync(logsPath, { recursive: true });

  const serviceLog = path.join(logsPath, `${serviceSlug(name)}.log`);
  const errorsLog = path.join(logsPath, "errors.log");
  const level = process.env.LOG_LEVEL ?? "info";

  return pino(
    {
      name: serviceSlug(name),
      level,
      base: {
        service: name,
        environment: process.env.NODE_ENV ?? "development"
      },
      timestamp: pino.stdTimeFunctions.isoTime
    },
    pino.multistream([
      { stream: process.stdout },
      { stream: pino.destination({ dest: serviceLog, sync: false }) },
      { level: "error", stream: pino.destination({ dest: errorsLog, sync: false }) }
    ])
  );
}

function parseCorsOrigins() {
  const rawOrigins = process.env.CORS_ORIGINS ?? process.env.GATEWAY_CORS_ORIGINS;
  if (!rawOrigins || rawOrigins === "*") {
    return true;
  }

  return rawOrigins.split(",").map((origin) => origin.trim()).filter(Boolean);
}

function parseCorsAllowedHeaders() {
  const rawHeaders =
    process.env.CORS_ALLOWED_HEADERS ??
    process.env.GATEWAY_CORS_ALLOWED_HEADERS ??
    "Authorization,Content-Type,X-Request-Id,Accept";

  return rawHeaders.split(",").map((header) => header.trim()).filter(Boolean);
}

function registerProcessHandlers(logger: Logger) {
  if (processHandlersRegistered) {
    return;
  }

  processHandlersRegistered = true;

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
    setTimeout(() => process.exit(1), 100).unref();
  });

  process.on("uncaughtException", (error) => {
    logger.fatal({ error }, "Uncaught exception");
    setTimeout(() => process.exit(1), 100).unref();
  });
}

async function resolveStatus(readinessCheck?: ServiceReadinessCheck): Promise<HealthStatus> {
  if (!readinessCheck) {
    return "healthy";
  }

  return (await readinessCheck()) ? "healthy" : "unhealthy";
}

function buildHealthPayload(
  service: Pick<ServiceDefinition, "name" | "description" | "port">,
  startedAt: string,
  status: HealthStatus
) {
  return {
    service: service.name,
    description: service.description,
    status,
    port: service.port,
    uptime: Math.round(process.uptime()),
    version: process.env.npm_package_version ?? "0.2.0",
    environment: process.env.NODE_ENV ?? "development",
    startedAt
  };
}

export function startService({
  name,
  description,
  port,
  preRoutes = [],
  routes = [],
  readinessCheck
}: ServiceDefinition) {
  dotenv.config();

  const logger = createLogger(name);
  registerProcessHandlers(logger);

  const app = express();
  const startedAt = new Date().toISOString();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    allowedHeaders: parseCorsAllowedHeaders(),
    exposedHeaders: ["X-Request-Id"],
    origin: parseCorsOrigins()
  }));
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = request.header("x-request-id") ?? randomUUID();
    response.locals.requestId = requestId;
    response.setHeader("X-Request-Id", requestId);
    next();
  });

  app.use((request: Request, response: Response, next: NextFunction) => {
    const started = Date.now();

    response.on("finish", () => {
      logger.info(
        {
          requestId: response.locals.requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - started
        },
        "request completed"
      );
    });

    next();
  });

  for (const registerRoutes of preRoutes) {
    registerRoutes(app);
  }

  app.use(express.json({ limit: "10mb" }));

  app.get("/", (_request: Request, response: Response) => {
    response.json({
      service: name,
      description,
      status: "online",
      health: "/health",
      live: "/health/live",
      ready: "/health/ready"
    });
  });

  app.get("/health", async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const status = await resolveStatus(readinessCheck);
      response.status(status === "healthy" ? 200 : 503).json(buildHealthPayload({ name, description, port }, startedAt, status));
    } catch (error) {
      next(error);
    }
  });

  app.get("/health/live", (_request: Request, response: Response) => {
    response.json(buildHealthPayload({ name, description, port }, startedAt, "healthy"));
  });

  app.get("/health/ready", async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const status = await resolveStatus(readinessCheck);
      response.status(status === "healthy" ? 200 : 503).json(buildHealthPayload({ name, description, port }, startedAt, status));
    } catch (error) {
      next(error);
    }
  });

  for (const registerRoutes of routes) {
    registerRoutes(app);
  }

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    logger.error({ error, requestId: response.locals.requestId }, "request failed");
    response.status(500).json({
      error: "internal_server_error",
      requestId: response.locals.requestId
    });
  };

  app.use(errorHandler);

  const host = process.env.HOST ?? "0.0.0.0";
  app.listen(port, host, () => {
    logger.info({ host, port }, `${name} listening`);
  });

  return app;
}
