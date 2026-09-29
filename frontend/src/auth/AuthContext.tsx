import * as React from "react";

import { demoLogin, fetchMe, login as loginRequest, type LoginPayload } from "@/services/auth";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => {
    const cached = localStorage.getItem("current_user");
    return cached ? (JSON.parse(cached) as User) : null;
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [authError, setAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

    if (!token && !isDemoMode) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const initAuth = async () => {
      try {
        if (!token && isDemoMode) {
          const { access_token, user: loggedInUser } = await demoLogin();
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("current_user", JSON.stringify(loggedInUser));
          setUser(loggedInUser);
          setAuthError(null);
        } else {
          const me = await fetchMe(controller.signal);
          setUser(me);
          setAuthError(null);
          localStorage.setItem("current_user", JSON.stringify(me));
        }
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("current_user");
        if (isDemoMode) {
          try {
            const { access_token, user: loggedInUser } = await demoLogin();
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("current_user", JSON.stringify(loggedInUser));
            setUser(loggedInUser);
          } catch {
            setUser(null);
            setAuthError("Demo authentication is unavailable. Please try again shortly.");
          }
        } else {
          setUser(null);
        }
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    initAuth();



    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const login = React.useCallback(async (payload: LoginPayload) => {
    const { access_token, user: loggedInUser } = await loginRequest(payload);
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("current_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, authError, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
