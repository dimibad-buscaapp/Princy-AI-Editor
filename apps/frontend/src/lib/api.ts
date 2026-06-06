import { getClientApiBaseUrl, getClientGatewayUrl } from "./gateway-url";

export function normalizeApiBase(base: string): string {
  return base.replace(/\/+$/, "").replace(/\/api\/api$/, "/api");
}

export function getApiBase(): string {
  return normalizeApiBase(getClientApiBaseUrl());
}

/** Monta URL de proxy /api/* sem duplicar prefixo. */
export function apiUrl(path: string): string {
  const base = normalizeApiBase(getApiBase());
  let p = path.startsWith("/") ? path : `/${path}`;
  if (p.startsWith("/api/")) p = p.slice(4);
  return `${base}${p}`;
}

/** Rotas nativas do gateway (fora do proxy /api). */
export function gatewayUrl(path: string): string {
  const base = getClientGatewayUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function eventsStreamUrl(): string {
  return gatewayUrl("/api/events/stream");
}
