import { useState } from "react";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Textarea } from "../ui/Textarea";
import { arrayToLines, linesToArray } from "./utils";

export function StrategySection({ plan, disabled, onSave }: SectionProps) {
  const [statement, setStatement] = useState(plan.positioning?.statement || "");
  const [differentiatorsText, setDifferentiatorsText] = useState(arrayToLines(plan.positioning?.differentiators));
  const [strategicRationale, setStrategicRationale] = useState(plan.strategic_rationale || "");

  const resetForm = () => {
    setStatement(plan.positioning?.statement || "");
    setDifferentiatorsText(arrayToLines(plan.positioning?.differentiators));
    setStrategicRationale(plan.strategic_rationale || "");
  };

  const getPatch = () => ({
    positioning: {
      statement,
      differentiators: linesToArray(differentiatorsText),
    },
    strategic_rationale: strategicRationale,
  });

  return (
    <SectionWrapper
      sectionKey="strategy"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-5">
            <Textarea
              label="Positioning Statement"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={4}
              placeholder="For [target], this brand is [category] that [benefit] because [reason]..."
            />

            <Textarea
              label="Key Differentiators (one per line)"
              value={differentiatorsText}
              onChange={(e) => setDifferentiatorsText(e.target.value)}
              rows={4}
              placeholder="What makes this business distinct"
            />

            <Textarea
              label="Strategic Rationale"
              value={strategicRationale}
              onChange={(e) => setStrategicRationale(e.target.value)}
              rows={5}
              placeholder="Why this strategic direction was chosen"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Positioning Statement
              </h3>
              <div className="rounded-lg border border-accent/30 bg-accent-soft p-5 text-body font-medium text-ink leading-relaxed">
                "{plan.positioning?.statement || "No positioning statement specified."}"
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Key Differentiators
              </h3>
              {plan.positioning?.differentiators && plan.positioning.differentiators.length > 0 ? (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {plan.positioning.differentiators.map((diff, i) => (
                    <li key={i} className="flex items-start gap-3 rounded border border-line bg-bg-sunken p-3 text-small text-ink">
                      <span className="font-semibold text-accent">•</span>
                      <span>{diff}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-small text-ink-muted">No differentiators specified.</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Strategic Rationale
              </h3>
              <div className="rounded-md border border-line bg-bg-sunken p-4 text-body text-ink leading-relaxed whitespace-pre-line">
                {plan.strategic_rationale || "No strategic rationale provided."}
              </div>
            </div>
          </div>
        )
      }
    </SectionWrapper>
  );
}
