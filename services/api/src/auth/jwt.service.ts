import jwt from "jsonwebtoken";
import {
  AUTH_ENV,
  DEFAULT_ACCESS_TOKEN_EXPIRES_IN,
  DEFAULT_REFRESH_TOKEN_EXPIRES_IN
} from "./auth.constants.js";
import type { AuthTokenPayload, JwtServiceOptions, VerifiedAuthToken } from "./auth.types.js";

function getRequiredSecret(value: string | undefined, envName: string) {
  if (!value) {
    throw new Error(`${envName} is required.`);
  }

  return value;
}

function assertAuthTokenPayload(payload: string | jwt.JwtPayload): asserts payload is VerifiedAuthToken {
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid auth token payload.");
  }
}

export class JwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTokenExpiresIn: jwt.SignOptions["expiresIn"];
  private readonly refreshTokenExpiresIn: jwt.SignOptions["expiresIn"];

  constructor(options: JwtServiceOptions = {}) {
    this.accessSecret = getRequiredSecret(
      options.accessSecret ?? process.env[AUTH_ENV.jwtSecret],
      AUTH_ENV.jwtSecret
    );
    this.refreshSecret = getRequiredSecret(
      options.refreshSecret ?? process.env[AUTH_ENV.jwtRefreshSecret],
      AUTH_ENV.jwtRefreshSecret
    );
    this.accessTokenExpiresIn =
      (options.accessTokenExpiresIn ??
        process.env[AUTH_ENV.jwtExpiresIn] ??
        DEFAULT_ACCESS_TOKEN_EXPIRES_IN) as jwt.SignOptions["expiresIn"];
    this.refreshTokenExpiresIn =
      (options.refreshTokenExpiresIn ??
        process.env[AUTH_ENV.jwtRefreshExpiresIn] ??
        DEFAULT_REFRESH_TOKEN_EXPIRES_IN) as jwt.SignOptions["expiresIn"];
  }

  signAccessToken(payload: AuthTokenPayload) {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessTokenExpiresIn
    });
  }

  signRefreshToken(payload: AuthTokenPayload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshTokenExpiresIn
    });
  }

  verifyAccessToken(token: string) {
    const payload = jwt.verify(token, this.accessSecret);
    assertAuthTokenPayload(payload);
    return payload;
  }

  verifyRefreshToken(token: string) {
    const payload = jwt.verify(token, this.refreshSecret);
    assertAuthTokenPayload(payload);
    return payload;
  }
}
