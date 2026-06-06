const GATEWAY_PORT = process.env.GATEWAY_PORT ?? process.env.NEXT_PUBLIC_GATEWAY_PORT ?? "3407";

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

/** Server-side gateway base URL for Next.js route handlers. */
export function getGatewayUrl(): string {
  return stripTrailingSlash(
    process.env.GATEWAY_URL ??
      process.env.PUBLIC_GATEWAY_URL ??
      process.env.NEXT_PUBLIC_GATEWAY_URL ??
      "http://127.0.0.1:3407"
  );
}

/** Gateway URL in the browser — derives host from the current page (avoids loopback PNA block). */
export function getClientGatewayUrl(): string {
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "https:" : "http:";
    return `${proto}//${window.location.hostname}:${GATEWAY_PORT}`;
  }
  return getGatewayUrl();
}

/** API base URL for client fetch (`/api/*` via gateway). */
export function getClientApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${getClientGatewayUrl()}/api`;
  }
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  return envUrl ?? `${getGatewayUrl()}/api`;
}
