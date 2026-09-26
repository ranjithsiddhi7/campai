import { useEffect, useState } from "react";

/** Staged messages for a real 30–90 second generate call (H5 item 2). Seconds → message. */
const STAGES: Array<[number, string]> = [
  [0, "Reading your brief"],
  [8, "Choosing who to target"],
  [18, "Shaping the message and the offer"],
  [30, "Picking channels and splitting the budget"],
  [45, "Writing content and the calendar"],
  [65, "Checking numbers and dates"],
];

/** Progress screen. The bar reaches 90% over 75 s and never hits 100% before the response arrives. */
export function GenerationProgress() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed((Date.now() - started) / 1000), 250);
    return () => window.clearInterval(timer);
  }, []);

  const stageIndex = STAGES.reduce((acc, [at], i) => (elapsed >= at ? i : acc), 0);
  const percent = Math.min(90, (elapsed / 75) * 90);

  return (
    <div className="mx-auto max-w-prose py-10 sm:py-16">
      <h1 className="text-h2 text-ink sm:text-h1">Building your campaign</h1>
      <p className="mt-3 text-body text-ink-secondary">This usually takes 30 to 90 seconds.</p>

      <div
        className="mt-10 h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="Building your campaign"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-slow ease-linear" style={{ width: `${percent}%` }} />
      </div>

      <p aria-live="polite" className="mt-6 text-h3 font-normal text-ink">
        {STAGES[stageIndex][1]}…
      </p>

      <ol className="mt-8 space-y-2" aria-hidden="true">
        {STAGES.map(([, label], i) => (
          <li key={label} className={`flex items-center gap-3 text-small ${i < stageIndex ? "text-ink-secondary" : i === stageIndex ? "text-ink" : "text-ink-muted"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${i < stageIndex ? "bg-state-success" : i === stageIndex ? "bg-accent" : "bg-line-strong"}`} />
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
