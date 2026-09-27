import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { INVALID_CREDENTIALS, useAuth } from "../../hooks/useAuth";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Button, Input, PageSpinner } from "../ui";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
}

const COPY = {
  "sign-in": {
    title: "Welcome back",
    doc: "Sign in",
    button: "Sign in",
    busy: "Signing you in…",
    switchText: "New to campAI?",
    switchLink: "Create an account",
    switchTo: "/sign-up",
  },
  "sign-up": {
    title: "Create your account",
    doc: "Sign up",
    button: "Create account",
    busy: "Creating your account…",
    switchText: "Already have an account?",
    switchLink: "Sign in",
    switchTo: "/sign-in",
  },
} as const;

/** Shared email + password form for /sign-in and /sign-up (H2). */
export function AuthForm({ mode }: AuthFormProps) {
  const copy = COPY[mode];
  useDocumentTitle(copy.doc);
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as { from?: string; email?: string } | null;
  const from = navState?.from;

  const [email, setEmail] = useState(navState?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  if (loading) return <PageSpinner />;
  if (user && !busy) return <Navigate to={from ?? "/app"} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Use a password with at least 6 characters.");
    setBusy(true);
    if (mode === "sign-up") {
      const res = await signUp(email, password);
      if (res.error || !res.signedIn) {
        setBusy(false);
        setError(res.error);
        setNeedsSignIn(!res.error);
        return;
      }
      navigate("/app", { replace: true });
      return;
    }
    const err = await signIn(email, password);
    if (err) {
      setBusy(false);
      setError(err);
      return;
    }
    navigate(from ?? "/app", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg px-4 text-ink">
      <header className="mx-auto flex h-16 w-full max-w-content items-center sm:px-2">
        <Link to="/" className="rounded text-h3 tracking-tight focus:outline-none focus-visible:shadow-focus">
          camp<span className="text-accent">AI</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center pb-16">
        <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <h1 className="text-h2 text-ink">{copy.title}</h1>
          <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            <Input
              label="Password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint={mode === "sign-up" ? "At least 6 characters." : undefined}
              required
            />
            <p aria-live="polite" className="min-h-[1.25rem] text-small text-state-danger">
              {error}
              {error === INVALID_CREDENTIALS && (
                <>
                  {" "}New here?{" "}
                  <Link to="/sign-up" state={{ ...navState, email }} className="rounded text-accent underline underline-offset-4 focus:outline-none focus-visible:shadow-focus">
                    Create an account
                  </Link>
                </>
              )}
            </p>
            {needsSignIn && (
              <p role="status" className="text-small text-ink">
                Account created. Please{" "}
                <Link to="/sign-in" state={{ ...navState, email }} className="rounded text-accent underline underline-offset-4 focus:outline-none focus-visible:shadow-focus">
                  sign in
                </Link>
                .
              </p>
            )}
            <Button type="submit" size="lg" busy={busy} busyLabel={copy.busy} className="w-full">
              {copy.button}
            </Button>
          </form>
          <p className="mt-6 text-small text-ink-secondary">
            {copy.switchText}{" "}
            <Link to={copy.switchTo} state={location.state} className="rounded text-accent underline-offset-4 hover:underline focus:outline-none focus-visible:shadow-focus">
              {copy.switchLink}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
