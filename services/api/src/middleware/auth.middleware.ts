import type { NextFunction, Request, Response } from "express";
import { JwtService } from "../auth/jwt.service.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

function getBearerToken(request: Request) {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export function authenticate(jwt = new JwtService()) {
  return (request: Request, response: Response, next: NextFunction) => {
    const token = getBearerToken(request);

    if (!token) {
      response.status(401).json({ error: "unauthorized", message: "Missing bearer token." });
      return;
    }

    try {
      const payload = jwt.verifyAccessToken(token);
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      };
      next();
    } catch {
      response.status(401).json({ error: "unauthorized", message: "Invalid or expired token." });
    }
  };
}
