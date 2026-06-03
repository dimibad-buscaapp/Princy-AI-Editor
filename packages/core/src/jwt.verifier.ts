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
    if (!accessSecret || accessSecret.length < 32) {
      throw new Error(
        "JWT_SECRET is required (min 32 chars). Run: npm run env:setup on the VPS."
      );
    }
    if (/CHANGE_ME|GERAR_|SUA_SENHA/i.test(accessSecret)) {
      throw new Error(
        "JWT_SECRET is still a placeholder. Run: npm run env:setup on the VPS."
      );
    }
    this.accessSecret = accessSecret;
  }

  verifyAccessToken(token: string): VerifiedToken {
    const payload = jwt.verify(token, this.accessSecret);
    assertPayload(payload);
    return payload;
  }
}
