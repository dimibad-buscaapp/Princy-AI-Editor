"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getMe, login as loginRequest, refresh as refreshRequest, logout as logoutRequest } from "../lib/auth-client";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "../lib/token-storage";
import type { AuthUser } from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(user && accessToken);

  const clearSession = (): void => {
    setUser(null);
    setAccessToken(null);
    clearAuthState();
  };

  const refreshSession = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearSession();
      return false;
    }

    try {
      const result = await refreshRequest(refreshToken);
      setTokens(result.accessToken, result.refreshToken);
      setAccessToken(result.accessToken);
      return true;
    } catch {
      clearSession();
      return false;
    }
  };

  const loadCurrentUser = async (): Promise<void> => {
    setLoading(true);

    const storedAccessToken = getAccessToken();
    const storedRefreshToken = getRefreshToken();

    if (!storedAccessToken) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await getMe(storedAccessToken);
      setUser(currentUser);
      setAccessToken(storedAccessToken);
    } catch (error) {
      if (storedRefreshToken) {
        const refreshed = await refreshSession();
        if (refreshed) {
          const newAccessToken = getAccessToken();
          if (newAccessToken) {
            try {
              const currentUser = await getMe(newAccessToken);
              setUser(currentUser);
              setAccessToken(newAccessToken);
            } catch {
              clearSession();
            }
          } else {
            clearSession();
          }
        } else {
          clearSession();
        }
      } else {
        clearSession();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await loginRequest(email, password);
    setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
    setAccessToken(response.accessToken);
  };

  const logout = (): void => {
    clearSession();
    void logoutRequest();
  };

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated,
      loading,
      login,
      logout,
      refreshSession,
      loadCurrentUser
    }),
    [user, accessToken, isAuthenticated, loading]
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
