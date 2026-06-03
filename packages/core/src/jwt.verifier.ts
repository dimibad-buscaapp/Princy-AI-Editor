import jwt from "jsonwebtoken";
import type { AuthUserRole } from "./auth.middleware.js";

export type VerifiedToken = {
  sub: string;
  email: string;
  role: AuthUserRole;
};

function assertPayload(payload: string | jwt.JwtPayload): asserts payload is VerifiedToken {
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid auth token payload.");
  }
}

export class JwtVerifier {
  private readonly accessSecret: string;

  constructor(accessSecret = process.env.JWT_SECRET) {
    if (!accessSecret) {
      throw new Error("JWT_SECRET is required.");
    }
    this.accessSecret = accessSecret;
  }

  verifyAccessToken(token: string): VerifiedToken {
    const payload = jwt.verify(token, this.accessSecret);
    assertPayload(payload);
    return payload;
  }
}
