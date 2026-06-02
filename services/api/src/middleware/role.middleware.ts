import type { NextFunction, Request, Response } from "express";
import type { AuthUserRole } from "../auth/auth.types.js";

export function requireRole(roles: AuthUserRole | AuthUserRole[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user) {
      response.status(401).json({ error: "unauthorized", message: "Authentication required." });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      response.status(403).json({ error: "forbidden", message: "Insufficient role." });
      return;
    }

    next();
  };
}
