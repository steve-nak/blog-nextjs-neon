"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  authError: string | null;
  setSession: (nextToken: string, nextUser: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const tokenKey = "blog_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  const setSession = useCallback((nextToken: string, nextUser: User) => {
    localStorage.setItem(tokenKey, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setAuthError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(tokenKey);

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Your session could not be restored.");
      }

      setToken(storedToken);
      setUser(data.user);
    } catch (error) {
      localStorage.removeItem(tokenKey);
      setToken(null);
      setUser(null);
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const restoreSession = window.setTimeout(() => {
      void refreshUser();
    }, 0);

    return () => window.clearTimeout(restoreSession);
  }, [refreshUser]);

  useEffect(() => {
    document.body.dataset.authReady = loading ? "false" : "true";

    return () => {
      delete document.body.dataset.authReady;
    };
  }, [loading]);

  const value = useMemo(
    () => ({ user, token, loading, authError, setSession, logout, refreshUser }),
    [user, token, loading, authError, setSession, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
