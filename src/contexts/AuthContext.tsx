"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { buildApiUrl } from "@/lib/api-config";

interface AuthContextType {
  user: any;
  token: string | null;
  isLoading: boolean;
  sessions: any[];
  fetchSessions: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  googleLogin: () => Promise<void>;
  githubLogin: () => Promise<void>;
  handleOAuthCallback: (provider: string, code: string, state: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (Array.isArray(error) && error.length > 0) {
    const first = error[0];
    if (typeof first === "string" && first.trim()) {
      return first;
    }
    if (
      first &&
      typeof first === "object" &&
      "msg" in first &&
      typeof first.msg === "string" &&
      first.msg.trim()
    ) {
      return first.msg;
    }
  }

  if (
    error &&
    typeof error === "object" &&
    "msg" in error &&
    typeof error.msg === "string" &&
    error.msg.trim()
  ) {
    return error.msg;
  }

  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(buildApiUrl("/sessions"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(Array.isArray(data) ? data : (data.sessions || []));
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  }, [token]);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchSessions();
    }
  }, [token, fetchSessions]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const rt = localStorage.getItem("refresh_token");
    if (!rt) return false;
    try {
      const response = await fetch(buildApiUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch(buildApiUrl("/auth/me"), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem("access_token");
          if (newToken) {
            const retryResponse = await fetch(buildApiUrl("/auth/me"), {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            if (retryResponse.ok) {
              const userData = await retryResponse.json();
              setUser(userData);
              return;
            }
          }
        }
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setToken(null);
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setToken(null);
      }
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(buildApiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(getErrorMessage(error.detail, "Login failed"));
    }

    const data = await response.json();

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, full_name: string) => {
    const response = await fetch(buildApiUrl("/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(getErrorMessage(error.detail, "Registration failed"));
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setSessions([]);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/auth";
  }, []);

  const googleLogin = useCallback(async () => {
    const response = await fetch(buildApiUrl("/auth/google"));
    if (!response.ok) throw new Error("Google login not available");
    const data = await response.json();
    window.location.href = data.url;
  }, []);

  const githubLogin = useCallback(async () => {
    const response = await fetch(buildApiUrl("/auth/github"));
    if (!response.ok) throw new Error("GitHub login not available");
    const data = await response.json();
    window.location.href = data.url;
  }, []);

  const handleOAuthCallback = useCallback(async (provider: string, code: string, state: string) => {
    const endpoint = provider === "google" ? "/auth/google/callback" : "/auth/github/callback";
    const response = await fetch(buildApiUrl(endpoint), {
      method: "POST",
      body: new URLSearchParams({ code, state }),
    });

    if (!response.ok) {
      throw new Error(`${provider} login failed`);
    }

    const data = await response.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    const response = await fetch(buildApiUrl(`/auth/verify?token=${encodeURIComponent(token)}`));
    if (!response.ok) {
      throw new Error("Email verification failed");
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const response = await fetch(buildApiUrl("/auth/forgot-password"), {
      method: "POST",
      body: new URLSearchParams({ email }),
    });

    if (!response.ok) {
      throw new Error("Failed to send reset email");
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    const response = await fetch(buildApiUrl("/auth/reset-password"), {
      method: "POST",
      body: new URLSearchParams({ token, new_password: newPassword }),
    });

    if (!response.ok) {
      throw new Error("Failed to reset password");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        sessions,
        fetchSessions,
        login,
        register,
        logout,
        googleLogin,
        githubLogin,
        handleOAuthCallback,
        verifyEmail,
        forgotPassword,
        resetPassword,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
