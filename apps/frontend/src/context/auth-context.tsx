"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { getMe, login as loginRequest, refresh as refreshRequest, logout as logoutRequest } from "../lib/auth-client";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "../lib/token-storage";
import { getTokenExpirationTime, isTokenExpired } from "../lib/jwt";
import type { AuthUser } from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionMessage: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  loadCurrentUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function clearAuthState(): void {
  clearTokens();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const isAuthenticated = Boolean(user && accessToken);

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const clearSession = (): void => {
    clearRefreshTimer();
    setUser(null);
    setAccessToken(null);
    setSessionMessage(null);
    clearAuthState();
  };

  const scheduleRefresh = (token: string) => {
    clearRefreshTimer();

    const expirationTime = getTokenExpirationTime(token);
    if (!expirationTime) {
      return;
    }

    const refreshBefore = 60_000;
    const delay = Math.max(expirationTime - Date.now() - refreshBefore, 5_000);

    refreshTimerRef.current = setTimeout(async () => {
      setSessionMessage("Reconectando sessão...");
      const refreshed = await refreshSession();

      if (!refreshed) {
        setSessionMessage("Não foi possível renovar sua sessão.");
        clearSession();
        router.replace("/login");
      } else {
        setSessionMessage(null);
      }
    }, delay);
  };

  const refreshSession = async (): Promise<boolean> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const promise = (async (): Promise<boolean> => {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearSession();
        return false;
      }

      try {
        const result = await refreshRequest(refreshToken);
        setTokens(result.accessToken, result.refreshToken);
        setAccessToken(result.accessToken);
        scheduleRefresh(result.accessToken);
        return true;
      } catch {
        clearSession();
        return false;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  };

  const loadCurrentUser = async (): Promise<void> => {
    setLoading(true);

    const storedAccessToken = getAccessToken();
    const storedRefreshToken = getRefreshToken();

    if (!storedAccessToken && storedRefreshToken) {
      setSessionMessage("Reconectando sessão...");
      const refreshed = await refreshSession();
      if (!refreshed) {
        clearSession();
        setLoading(false);
        return;
      }
    }

    const tokenToUse = getAccessToken();
    if (!tokenToUse) {
      setLoading(false);
      return;
    }

    if (isTokenExpired(tokenToUse, 10)) {
      setSessionMessage("Reconectando sessão...");
      const refreshed = await refreshSession();
      if (!refreshed) {
        clearSession();
        setLoading(false);
        return;
      }
    }

    try {
      const currentToken = getAccessToken();
      if (!currentToken) {
        clearSession();
        setLoading(false);
        return;
      }

      const currentUser = await getMe(currentToken);
      setUser(currentUser);
      setAccessToken(currentToken);
      scheduleRefresh(currentToken);
      setSessionMessage(null);
    } catch {
      const refreshed = storedRefreshToken ? await refreshSession() : false;
      if (!refreshed) {
        clearSession();
      } else {
        const refreshedToken = getAccessToken();
        if (refreshedToken) {
          try {
            const currentUser = await getMe(refreshedToken);
            setUser(currentUser);
            setAccessToken(refreshedToken);
            scheduleRefresh(refreshedToken);
            setSessionMessage(null);
          } catch {
            clearSession();
          }
        } else {
          clearSession();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setSessionMessage(null);
    const response = await loginRequest(email, password);
    setTokens(response.accessToken, response.refreshToken);
    setAccessToken(response.accessToken);
    setUser(response.user);
    scheduleRefresh(response.accessToken);
  };

  const logout = (): void => {
    clearSession();
    void logoutRequest();
    router.replace("/login");
  };

  useEffect(() => {
    void loadCurrentUser();
    return () => clearRefreshTimer();
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated,
      loading,
      sessionMessage,
      login,
      logout,
      refreshSession,
      loadCurrentUser
    }),
    [user, accessToken, isAuthenticated, loading, sessionMessage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  }

  return context;
}
