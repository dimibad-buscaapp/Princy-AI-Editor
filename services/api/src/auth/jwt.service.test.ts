import assert from "node:assert/strict";
import test from "node:test";
import { JwtService } from "./jwt.service.js";
import type { AuthTokenPayload } from "./auth.types.js";

const payload: AuthTokenPayload = {
  sub: "user_123",
  email: "admin@princy.local",
  role: "ADMIN"
};

test("JwtService signs and verifies access tokens", () => {
  const service = new JwtService({
    accessSecret: "access-secret-for-tests",
    refreshSecret: "refresh-secret-for-tests",
    accessTokenExpiresIn: "1h",
    refreshTokenExpiresIn: "30d"
  });

  const token = service.signAccessToken(payload);
  const verified = service.verifyAccessToken(token);

  assert.equal(verified.sub, payload.sub);
  assert.equal(verified.email, payload.email);
  assert.equal(verified.role, payload.role);
});

test("JwtService signs and verifies refresh tokens", () => {
  const service = new JwtService({
    accessSecret: "access-secret-for-tests",
    refreshSecret: "refresh-secret-for-tests",
    accessTokenExpiresIn: "1h",
    refreshTokenExpiresIn: "30d"
  });

  const token = service.signRefreshToken(payload);
  const verified = service.verifyRefreshToken(token);

  assert.equal(verified.sub, payload.sub);
  assert.equal(verified.email, payload.email);
  assert.equal(verified.role, payload.role);
});

test("JwtService requires configured secrets", () => {
  assert.throws(() => new JwtService({}), /JWT_SECRET is required/);
});
