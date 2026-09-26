// AI note: Auth context and hook: session state, sign up, sign in, sign out, and a route guard. Email + password only.
// Destination: src/hooks/useAuth.tsx. Owner: Bolt creates it from this snippet in prompt H2; Claude Code may fix it while Bolt is idle.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Map Supabase auth errors to plain language. Returns null on success. */
function friendly(message: string | undefined): string | null {
  if (!message) return null;
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Try again.";
  if (m.includes("already registered")) return "There's already an account with this email. Sign in instead.";
  if (m.includes("password") && m.includes("at least")) return "Use a password with at least 6 characters.";
  if (m.includes("rate limit")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("email not confirmed")) return "This email hasn't been confirmed yet. Check your inbox.";
  return "Something went wrong signing you in. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      async signUp(email, password) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        return friendly(error?.message);
      },
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return friendly(error?.message);
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Wrap protected routes: <RequireAuth><Dashboard /></RequireAuth>. Shows nothing while the session loads. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-8 text-sm text-neutral-400" role="status" aria-live="polite">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
