// AI note: Top-level React error boundary: shows a calm error state with Retry instead of a blank page. Also used around the workspace.
// Destination: src/components/ErrorBoundary.tsx. Owner: Bolt creates it from this snippet in prompt G (starting prompt); Claude Code may fix it while Bolt is idle.

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional: where the user lands after "Go to dashboard". */
  homeHref?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Never log secrets. Errors here are UI errors; the console is enough for the hackathon.
    console.error("campAI UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const configError = /Supabase is not configured|secret key/i.test(this.state.error.message);
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-neutral-800 p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-neutral-400">
            {configError
              ? "campAI isn't set up correctly on this deployment. Please tell the team."
              : "This page hit an unexpected error. Your saved campaigns are safe."}
          </p>
          {configError && <p className="mt-2 text-xs text-neutral-500 break-words">{this.state.error.message}</p>}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <a
              href={this.props.homeHref ?? "/app"}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
            >
              Go to dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
}
