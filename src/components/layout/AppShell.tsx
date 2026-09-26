import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Plus, Settings } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { buttonClasses } from "../ui";

const iconLink =
  "inline-flex h-10 w-10 items-center justify-center rounded text-ink-secondary transition-colors duration-fast hover:bg-surface-hover hover:text-ink focus:outline-none focus-visible:shadow-focus";

/** Signed-in frame: top bar (wordmark, New campaign, Settings, Sign out) and the page content via <Outlet />. */
export function AppShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function onSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/app" className="rounded text-h3 tracking-tight text-ink focus:outline-none focus-visible:shadow-focus">
            camp<span className="text-accent">AI</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <Link to="/app/new" className={buttonClasses("primary", "sm", "mr-1 sm:mr-2")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">New campaign</span>
              <span className="sm:hidden">New</span>
            </Link>
            <Link to="/app/settings" className={iconLink} aria-label="Settings" title="Settings">
              <Settings className="h-5 w-5" aria-hidden="true" />
            </Link>
            <button type="button" onClick={onSignOut} className={iconLink} aria-label="Sign out" title="Sign out">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
