import rateLimit from "express-rate-limit";

export function createGatewayRateLimit() {
  return rateLimit({
    windowMs: Number(process.env.GATEWAY_RATE_LIMIT_WINDOW_MS ?? 60_000),
    limit: Number(process.env.GATEWAY_RATE_LIMIT_MAX ?? 300),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "rate_limit_exceeded"
    }
  });
}
