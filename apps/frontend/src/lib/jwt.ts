export type JwtPayload = {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }

  if (typeof globalThis.Buffer !== "undefined") {
    return globalThis.Buffer.from(padded, "base64").toString("utf-8");
  }

  throw new Error("Não foi possível decodificar o JWT.");
}

export function parseJwt<T extends JwtPayload = JwtPayload>(token: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as T;
  } catch {
    return null;
  }
}

export function getTokenExpirationTime(token: string): number | null {
  const payload = parseJwt(token);
  if (!payload?.exp || typeof payload.exp !== "number") {
    return null;
  }

  return payload.exp * 1000;
}

export function getTokenRemainingTime(token: string): number | null {
  const expirationTime = getTokenExpirationTime(token);

  if (expirationTime === null) {
    return null;
  }

  return expirationTime - Date.now();
}

export function isTokenExpired(token: string, offsetSeconds = 0): boolean {
  const remainingTime = getTokenRemainingTime(token);

  if (remainingTime === null) {
    return false;
  }

  return remainingTime <= offsetSeconds * 1000;
}

export function shouldRefreshToken(token: string, thresholdSeconds = 30): boolean {
  const remainingTime = getTokenRemainingTime(token);

  if (remainingTime === null) {
    return false;
  }

  return remainingTime <= thresholdSeconds * 1000;
}
