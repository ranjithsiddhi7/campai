import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { buttonClasses } from "../components/ui";

export default function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-ink">
      <div className="max-w-md text-center">
        <p className="text-caption text-accent">404</p>
        <h1 className="mt-3 text-h1">We can't find that page</h1>
        <p className="mt-3 text-body text-ink-secondary">The link may be old, or the page has moved.</p>
        <Link to="/app" className={buttonClasses("primary", "md", "mt-8")}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
