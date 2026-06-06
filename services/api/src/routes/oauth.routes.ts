import { asyncHandler } from "@princy/core";
import type { Express } from "express";

const PROVIDERS = ["google", "github", "microsoft"] as const;

export function registerOAuthRoutes(app: Express) {
  app.get("/auth/oauth/:provider/start", asyncHandler(async (request, response) => {
    const provider = String(request.params.provider);
    if (!PROVIDERS.includes(provider as (typeof PROVIDERS)[number])) {
      response.status(400).json({ error: "unsupported_provider" });
      return;
    }
    const clientId = process.env[`OIDC_${provider.toUpperCase()}_CLIENT_ID`] ?? "";
    const redirectUri = process.env.OIDC_REDIRECT_URI ?? "http://127.0.0.1:3407/api/auth/oauth/callback";
    const state = `st_${Date.now()}`;
    const authUrl = clientId
      ? `https://oauth.${provider}.example/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
      : null;
    response.json({
      provider,
      scaffold: true,
      authUrl,
      state,
      message: clientId ? "Redirect user to authUrl" : "Configure OIDC_*_CLIENT_ID env vars"
    });
  }));

  app.get("/auth/oauth/:provider/callback", asyncHandler(async (request, response) => {
    const provider = String(request.params.provider);
    const code = request.query.code ? String(request.query.code) : undefined;
    response.json({
      provider,
      scaffold: true,
      code,
      message: "OIDC token exchange not configured — scaffold only"
    });
  }));
}
