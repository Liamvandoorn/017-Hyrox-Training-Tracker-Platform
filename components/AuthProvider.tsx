"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface AuthUser {
  id: number;
  displayName: string;
  role: "admin" | "user";
}

interface AuthState {
  user: AuthUser | null;
  setupRequired: boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    setupRequired: false,
    loading: true,
    error: null,
  });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const payload: unknown = await response.json();
        if (!response.ok || typeof payload !== "object" || payload === null) {
          throw new Error("Could not verify sign-in status");
        }
        const value = payload as { user?: AuthUser | null; setupRequired?: boolean };
        if (!cancelled) {
          setState({
            user: value.user ?? null,
            setupRequired: value.setupRequired === true,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            user: null,
            setupRequired: false,
            loading: false,
            error: error instanceof Error ? error.message : "Could not verify sign-in status",
          });
        }
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.loading || state.error) return;
    if (pathname !== "/" && !state.user) {
      router.replace("/");
    } else if (pathname === "/" && state.user) {
      router.replace("/dashboard");
    }
  }, [pathname, router, state.error, state.loading, state.user]);

  const isProtectedRoute = pathname !== "/";
  if (state.loading && isProtectedRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#aaa5ad]" role="status">
        Checking sign-in...
      </div>
    );
  }
  if (state.error && isProtectedRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-[#ffa8a4]" role="alert">
        {state.error}. Refresh the page to try again.
      </div>
    );
  }
  if (!state.loading && !state.user && isProtectedRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#aaa5ad]" role="status">
        Returning to sign in...
      </div>
    );
  }

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
