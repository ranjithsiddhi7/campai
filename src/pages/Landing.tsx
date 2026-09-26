import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { buttonClasses } from "../components/ui";

const COLUMNS = [
  { title: "Say it in your own words", text: "Tell us what you want the way you'd tell a friend. No marketing terms needed." },
  { title: "Answer only what we need", text: "Nine short questions about your goal, budget and customers. Most take seconds." },
  { title: "Get a complete, editable plan", text: "Audience, message, offer, channels, calendar, copy, budget and KPIs (key performance indicators), in about a minute." },
];

export default function Landing() {
  const { user } = useAuth();
  useDocumentTitle(null);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="mx-auto flex h-16 max-w-content items-center justify-between px-4 sm:px-6">
        <span className="text-h3 tracking-tight">
          camp<span className="text-accent">AI</span>
        </span>
        {!user && (
          <Link to="/sign-in" className={buttonClasses("ghost", "sm")}>
            Sign in
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-content px-4 sm:px-6">
        <section className="pb-20 pt-16 sm:pb-30 sm:pt-30">
          <h1 className="max-w-4xl text-h1 text-ink sm:text-display">Anyone can run a strategically sound campaign</h1>
          <p className="mt-6 max-w-prose text-body text-ink-secondary sm:text-h3 sm:font-normal">
            Describe what you want for your business. campAI turns it into one complete, editable marketing campaign you can start using this week.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {user ? (
              <Link to="/app" className={buttonClasses("primary", "lg")}>
                Open dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link to="/sign-up" className={buttonClasses("primary", "lg")}>
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/sign-in" className="rounded text-small text-ink-secondary underline-offset-4 hover:text-ink hover:underline focus:outline-none focus-visible:shadow-focus">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>

        <section aria-label="How it works" className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {COLUMNS.map((c, i) => (
            <div key={c.title} className="bg-bg p-6 sm:p-8">
              <span className="text-caption text-accent">0{i + 1}</span>
              <h2 className="mt-3 text-h3 text-ink">{c.title}</h2>
              <p className="mt-2 text-small text-ink-secondary">{c.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto max-w-content px-4 py-12 text-caption text-ink-muted sm:px-6">campAI · Campaign Operating System</footer>
    </div>
  );
}
