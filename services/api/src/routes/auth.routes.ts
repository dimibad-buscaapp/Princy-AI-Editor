import type { Express, NextFunction, Request, Response } from "express";
import { AuthError, AuthService } from "../auth/auth.service.js";
import { loginSchema, refreshSchema } from "../auth/schemas/index.js";
import { JwtService } from "../auth/jwt.service.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export type AuthRoutesOptions = {
  authService?: AuthService;
  jwtService?: JwtService;
};

function handleAuthError(error: unknown, response: Response) {
  if (error instanceof AuthError) {
    response.status(error.statusCode).json({ error: error.code, message: error.message });
    return true;
  }

  return false;
}

function handleValidationError(response: Response) {
  response.status(400).json({ error: "invalid_payload", message: "Invalid request payload." });
}

export function registerAuthRoutes(app: Express, options: AuthRoutesOptions = {}) {
  const authService = options.authService ?? new AuthService();
  const jwtService = options.jwtService ?? authService.jwt;
  const authenticateRequest = authenticate(jwtService);

  app.post("/auth/login", async (request: Request, response: Response, next: NextFunction) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      console.warn({ email: request.body?.email }, "login failure");
      handleValidationError(response);
      return;
    }

    try {
      const result = await authService.login(parsed.data);
      console.info({ userId: result.user.id, email: result.user.email }, "login success");
      response.json(result);
    } catch (error) {
      console.warn({ email: parsed.data.email }, "login failure");
      if (!handleAuthError(error, response)) {
        next(error);
      }
    }
  });

  app.post("/auth/refresh", async (request: Request, response: Response, next: NextFunction) => {
    const parsed = refreshSchema.safeParse(request.body);

    if (!parsed.success) {
      console.warn("refresh failure");
      handleValidationError(response);
      return;
    }

    try {
      const result = await authService.refresh(parsed.data);
      console.info({ userId: result.user.id }, "refresh success");
      response.json(result);
    } catch (error) {
      console.warn("refresh failure");
      if (!handleAuthError(error, response)) {
        next(error);
      }
    }
  });

  app.post("/auth/logout", (_request: Request, response: Response) => {
    response.json({ success: true });
  });

  app.get("/auth/me", authenticateRequest, async (request: Request, response: Response, next: NextFunction) => {
    try {
      const user = await authService.getUser(request.user?.id ?? "");
      response.json({ user });
    } catch (error) {
      if (!handleAuthError(error, response)) {
        next(error);
      }
    }
  });

  app.get("/auth/protected", authenticateRequest, (request: Request, response: Response) => {
    response.json({
      authenticated: true,
      user: request.user
    });
  });

  app.get("/auth/admin", authenticateRequest, requireRole("ADMIN"), (request: Request, response: Response) => {
    response.json({
      authenticated: true,
      user: request.user
    });
  });
}
