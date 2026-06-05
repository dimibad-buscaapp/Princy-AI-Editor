import { refresh } from "./auth-client";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./token-storage";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const REFRESH_THRESHOLD_SECONDS = 30;

type ApiRequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  skipAuth?: boolean;
};

function buildUrl(path: string, query?: Record<string, string | number | boolean | null | undefined>): string {
  const isAbsolute = /^https?:\/\//i.test(path);

  if (!isAbsolute && !apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL não está configurada.");
  }

  const url = isAbsolute
    ? new URL(path)
    : new URL(`${apiBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`, apiBaseUrl);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function createHeaders(headers?: HeadersInit, body?: unknown): Headers {
  const result = new Headers(headers);

  if (
    body !== undefined &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !result.has("Content-Type")
  ) {
    result.set("Content-Type", "application/json");
  }

  return result;
}

function buildRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (body instanceof FormData || body instanceof URLSearchParams || typeof body === "string" || body instanceof Blob) {
    return body;
  }

  return JSON.stringify(body);
}

function defaultErrorMessage(status: number): string {
  if (status === 401 || status === 403) {
    return "Sessão expirada. Faça login novamente.";
  }

  if (status === 404) {
    return "Recurso não encontrado.";
  }

  if (status >= 500) {
    return "Servidor indisponível. Tente novamente mais tarde.";
  }

  return "Falha ao conectar com a API.";
}

async function parseError(response: Response): Promise<Error> {
  const text = await response.text();
  let message = defaultErrorMessage(response.status);

  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (parsed?.message) {
        message = String(parsed.message);
      } else if (typeof parsed === "string") {
        message = parsed;
      }
    } catch {
      message = text;
    }
  }

  return new Error(message);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const result = await refresh(refreshToken);
    setTokens(result.accessToken, result.refreshToken);
    return result.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

async function executeRequest<T>(url: string, init: RequestInit, retried = false): Promise<T> {
  const response = await fetch(url, init);

  if ((response.status === 401 || response.status === 403) && !retried) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      return executeRequest<T>(url, { ...init, headers }, true);
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = "GET", headers, body, query, skipAuth = false } = options;
  const url = buildUrl(path, query);
  const finalHeaders = createHeaders(headers, body);

  if (!skipAuth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      finalHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  return executeRequest<T>(url, {
    method,
    headers: finalHeaders,
    body: buildRequestBody(body)
  });
}

export function apiGet<T = unknown>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export function apiPost<T = unknown>(
  path: string,
  body?: unknown,
  options?: Omit<ApiRequestOptions, "method" | "body">
) {
  return apiRequest<T>(path, { ...options, method: "POST", body });
}

export function apiPut<T = unknown>(
  path: string,
  body?: unknown,
  options?: Omit<ApiRequestOptions, "method" | "body">
) {
  return apiRequest<T>(path, { ...options, method: "PUT", body });
}

export function apiDelete<T = unknown>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
  return apiRequest<T>(path, { ...options, method: "DELETE" });
}

/** Alias for apiRequest — used across feature modules. */
export const apiFetch = apiRequest;
