import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import request from "supertest";
import { AuthService } from "../auth/auth.service.js";
import { JwtService } from "../auth/jwt.service.js";
import { PasswordService } from "../auth/password.service.js";
import { registerAuthRoutes } from "./auth.routes.js";
import type {
  CreateUserInput,
  SafeUser,
  UpdateUserInput,
  UserRepositoryLike,
  UserWithPasswordHash
} from "../repositories/user.repository.js";

class InMemoryUserRepository implements UserRepositoryLike {
  private readonly users: UserWithPasswordHash[];

  constructor(users: UserWithPasswordHash[]) {
    this.users = users;
  }

  async findUserByEmail(email: string) {
    return this.sanitize(this.users.find((user) => user.email === email) ?? null);
  }

  async findUserById(id: string) {
    return this.sanitize(this.users.find((user) => user.id === id) ?? null);
  }

  async findUserForAuthByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async createUser(data: CreateUserInput) {
    const now = new Date();
    const user: UserWithPasswordHash = {
      id: `user_${this.users.length + 1}`,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role ?? "DEVELOPER",
      createdAt: now,
      updatedAt: now
    };
    this.users.push(user);
    return this.sanitizeRequired(user);
  }

  async updateUser(id: string, data: UpdateUserInput) {
    const user = this.users.find((item) => item.id === id);

    if (!user) {
      throw new Error("User not found.");
    }

    Object.assign(user, data, { updatedAt: new Date() });
    return this.sanitizeRequired(user);
  }

  async listUsers() {
    return this.users.map((user) => this.sanitizeRequired(user));
  }

  private sanitize(user: UserWithPasswordHash | null): SafeUser | null {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private sanitizeRequired(user: UserWithPasswordHash): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

async function createTestApp() {
  const passwordService = new PasswordService({ rounds: 4 });
  const jwtService = new JwtService({
    accessSecret: "access-secret-for-route-tests",
    refreshSecret: "refresh-secret-for-route-tests",
    accessTokenExpiresIn: "1h",
    refreshTokenExpiresIn: "30d"
  });
  const now = new Date();
  const repository = new InMemoryUserRepository([
    {
      id: "admin_user",
      email: "admin@princy.local",
      name: "Princy Admin",
      role: "ADMIN",
      passwordHash: await passwordService.hashPassword("princy-admin-change-me"),
      createdAt: now,
      updatedAt: now
    },
    {
      id: "developer_user",
      email: "dev@princy.local",
      name: "Princy Developer",
      role: "DEVELOPER",
      passwordHash: await passwordService.hashPassword("developer-password"),
      createdAt: now,
      updatedAt: now
    }
  ]);
  const authService = new AuthService({
    jwt: jwtService,
    passwords: passwordService,
    users: repository
  });
  const app = express();
  app.use(express.json());
  registerAuthRoutes(app, { authService, jwtService });

  return app;
}

test("POST /auth/login returns tokens and sanitized user", async () => {
  const app = await createTestApp();

  const response = await request(app).post("/auth/login").send({
    email: "admin@princy.local",
    password: "princy-admin-change-me"
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.email, "admin@princy.local");
  assert.equal(response.body.user.role, "ADMIN");
  assert.equal(typeof response.body.accessToken, "string");
  assert.equal(typeof response.body.refreshToken, "string");
  assert.equal("passwordHash" in response.body.user, false);
});

test("POST /auth/login rejects invalid password", async () => {
  const app = await createTestApp();

  const response = await request(app).post("/auth/login").send({
    email: "admin@princy.local",
    password: "wrong-password"
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.error, "invalid_credentials");
});

test("POST /auth/login rejects invalid email payload", async () => {
  const app = await createTestApp();

  const response = await request(app).post("/auth/login").send({
    email: "not-an-email",
    password: "princy-admin-change-me"
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "invalid_payload");
});

test("POST /auth/refresh returns a new token response", async () => {
  const app = await createTestApp();
  const loginResponse = await request(app).post("/auth/login").send({
    email: "admin@princy.local",
    password: "princy-admin-change-me"
  });

  const response = await request(app).post("/auth/refresh").send({
    refreshToken: loginResponse.body.refreshToken
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.email, "admin@princy.local");
  assert.equal(typeof response.body.accessToken, "string");
});

test("GET /auth/protected requires authentication", async () => {
  const app = await createTestApp();
  const loginResponse = await request(app).post("/auth/login").send({
    email: "admin@princy.local",
    password: "princy-admin-change-me"
  });

  const response = await request(app)
    .get("/auth/protected")
    .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.authenticated, true);
  assert.equal(response.body.user.email, "admin@princy.local");
});

test("GET /auth/protected rejects missing token", async () => {
  const app = await createTestApp();

  const response = await request(app).get("/auth/protected");

  assert.equal(response.status, 401);
  assert.equal(response.body.error, "unauthorized");
});

test("GET /auth/admin allows ADMIN", async () => {
  const app = await createTestApp();
  const loginResponse = await request(app).post("/auth/login").send({
    email: "admin@princy.local",
    password: "princy-admin-change-me"
  });

  const response = await request(app)
    .get("/auth/admin")
    .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.authenticated, true);
});

test("GET /auth/admin rejects non-admin users", async () => {
  const app = await createTestApp();
  const loginResponse = await request(app).post("/auth/login").send({
    email: "dev@princy.local",
    password: "developer-password"
  });

  const response = await request(app)
    .get("/auth/admin")
    .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.error, "forbidden");
});
