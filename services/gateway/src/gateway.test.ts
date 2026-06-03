import assert from "node:assert/strict";
import { createServer, type IncomingHttpHeaders, type IncomingMessage } from "node:http";
import test from "node:test";
import express from "express";
import request from "supertest";
import { registerProxyRoutes } from "./proxy.js";
import { registerGatewayWhoamiRoute } from "./whoami.js";

type CapturedRequest = {
  body: string;
  headers: IncomingHttpHeaders;
  method?: string;
  url?: string;
};

function readBody(message: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];

    message.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    message.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    message.on("error", reject);
  });
}

async function createFakeApiServer() {
  const requests: CapturedRequest[] = [];

  const server = createServer(async (incomingRequest, response) => {
    const body = await readBody(incomingRequest);
    const captured = {
      body,
      headers: incomingRequest.headers,
      method: incomingRequest.method,
      url: incomingRequest.url
    };

    requests.push(captured);

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({
      body,
      hasAuthorization: Boolean(incomingRequest.headers.authorization),
      method: incomingRequest.method,
      path: incomingRequest.url,
      requestId: incomingRequest.headers["x-request-id"],
      gateway: incomingRequest.headers["x-princy-gateway"]
    }));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Fake API server did not bind to a TCP port.");
  }

  return {
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
    requests,
    url: `http://127.0.0.1:${address.port}`
  };
}

function createGatewayApp(targetUrl: string) {
  const app = express();

  app.use((incomingRequest, response, next) => {
    const requestId = incomingRequest.header("x-request-id") ?? "generated-test-request-id";

    response.locals.requestId = requestId;
    response.setHeader("X-Request-Id", requestId);
    next();
  });

  registerGatewayWhoamiRoute(app);
  registerProxyRoutes(app, [
    {
      path: "/api/auth",
      rewritePrefix: "/auth",
      target: {
        key: "api",
        name: "API",
        public: false,
        url: targetUrl
      }
    }
  ]);

  return app;
}

test("gateway whoami reports request context without exposing bearer token", async () => {
  const app = createGatewayApp("http://127.0.0.1:1");

  const response = await request(app)
    .get("/gateway/whoami")
    .set("Authorization", "Bearer secret-access-token")
    .set("X-Forwarded-Host", "editor.princy.local")
    .set("X-Forwarded-Proto", "https")
    .expect(200);

  assert.equal(response.body.gateway, true);
  assert.equal(response.body.requestId, "generated-test-request-id");
  assert.equal(response.body.hasAuthorization, true);
  assert.equal(response.body.forwarded.host, "editor.princy.local");
  assert.equal(response.body.forwarded.proto, "https");
  assert.equal(JSON.stringify(response.body).includes("secret-access-token"), false);
});

test("gateway proxies auth routes with rewritten path and preserved context headers", async () => {
  const fakeApi = await createFakeApiServer();

  try {
    const app = createGatewayApp(fakeApi.url);

    const response = await request(app)
      .post("/api/auth/login")
      .set("Authorization", "Bearer gateway-token")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .set("X-Request-Id", "req-auth-login")
      .send({ email: "admin@princy.local", password: "princy-admin-change-me" })
      .expect(200);

    assert.equal(response.body.path, "/auth/login");
    assert.equal(response.body.method, "POST");
    assert.equal(response.body.hasAuthorization, true);
    assert.equal(response.body.requestId, "req-auth-login");
    assert.equal(response.body.gateway, "true");
    assert.equal(fakeApi.requests[0]?.headers.authorization, "Bearer gateway-token");
    assert.match(String(fakeApi.requests[0]?.headers["x-forwarded-host"]), /^127\.0\.0\.1:\d+$/);
    assert.equal(fakeApi.requests[0]?.headers["x-forwarded-proto"], "http");
  } finally {
    await fakeApi.close();
  }
});

test("gateway generates request ids before proxying auth requests", async () => {
  const fakeApi = await createFakeApiServer();

  try {
    const app = createGatewayApp(fakeApi.url);

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer access-token")
      .expect(200);

    assert.equal(response.body.path, "/auth/me");
    assert.equal(response.body.requestId, "generated-test-request-id");
    assert.equal(fakeApi.requests[0]?.headers.authorization, "Bearer access-token");
  } finally {
    await fakeApi.close();
  }
});
