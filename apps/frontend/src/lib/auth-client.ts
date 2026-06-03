import type { AuthUser, LoginRequest, LoginResponse, RefreshResponse } from "../types/auth";

const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "") ?? "";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

function buildErrorMessage(response: Response, defaultMessage: string) {
  if (response.status === 401 || response.status === 403) {
    return "Sessão expirada. Faça login novamente.";
  }

  if (response.status === 400) {
    return "Email ou senha inválidos.";
  }

  if (response.status >= 500) {
    return "Servidor indisponível. Tente novamente mais tarde.";
  }

  return defaultMessage;
}

async function parseJson<T>(response: Response, defaultMessage: string): Promise<T> {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(defaultMessage);
  }
}

async function safeFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const errorMessage = buildErrorMessage(response, "Falha ao se conectar ao serviço de autenticação.");
    throw new Error(errorMessage);
  }

  return parseJson<T>(response, "Resposta inválida do servidor.");
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const url = `${gatewayUrl}/api/auth/login`;

  return safeFetch<LoginResponse>(url, {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const url = `${gatewayUrl}/api/auth/refresh`;

  return safeFetch<RefreshResponse>(url, {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export async function getMe(accessToken: string): Promise<AuthUser> {
  const url = `${apiBaseUrl}/auth/me`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorMessage = buildErrorMessage(response, "Não foi possível carregar os dados do usuário.");
    throw new Error(errorMessage);
  }

  return parseJson<AuthUser>(response, "Resposta inválida do servidor.");
}

export async function logout(): Promise<void> {
  try {
    const url = `${gatewayUrl}/api/auth/logout`;
    await fetch(url, { method: "POST" });
  } catch {
    // Ignorar falhas de logout no servidor, a limpeza local é suficiente.
  }
}
