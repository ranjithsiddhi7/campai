import { useState } from "react";
import type { Effort, NextAction, Risk } from "../../types/campaign";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Badge, type BadgeTone } from "../ui/Badge";
import { arrayToLines, linesToArray } from "./utils";

const EFFORT_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const EFFORT_TONES: Record<Effort, BadgeTone> = {
  small: "success",
  medium: "warning",
  large: "danger",
};

export function AssumptionsSection({ plan, disabled, onSave }: SectionProps) {
  const [assumptionsText, setAssumptionsText] = useState(arrayToLines(plan.assumptions));
  const [risks, setRisks] = useState<Risk[]>(
    plan.risks ? JSON.parse(JSON.stringify(plan.risks)) : []
  );
  const [nextActions, setNextActions] = useState<NextAction[]>(
    plan.next_actions ? JSON.parse(JSON.stringify(plan.next_actions)) : []
  );

  const resetForm = () => {
    setAssumptionsText(arrayToLines(plan.assumptions));
    setRisks(plan.risks ? JSON.parse(JSON.stringify(plan.risks)) : []);
    setNextActions(plan.next_actions ? JSON.parse(JSON.stringify(plan.next_actions)) : []);
  };

  const getPatch = () => ({
    assumptions: linesToArray(assumptionsText),
    risks,
    next_actions: nextActions,
  });

  const updateRisk = (index: number, field: keyof Risk, value: string) => {
    setRisks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRisk = () => {
    setRisks((prev) => [...prev, { risk: "", mitigation: "" }]);
  };

  const removeRisk = (index: number) => {
    setRisks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateNextAction = (index: number, field: keyof NextAction, value: string) => {
    setNextActions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addNextAction = () => {
    setNextActions((prev) => [...prev, { action: "", when: "", effort: "small" }]);
  };

  const removeNextAction = (index: number) => {
    setNextActions((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SectionWrapper
      sectionKey="assumptions"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-6">
            <Textarea
              label="Assumptions (one per line)"
              value={assumptionsText}
              onChange={(e) => setAssumptionsText(e.target.value)}
              rows={4}
              placeholder="Key assumptions made for this campaign"
            />

            {/* Risks Editor */}
            <div className="rounded-lg border border-line bg-bg-sunken p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-small font-semibold text-accent uppercase tracking-wider">
                  Risks & Mitigations
                </h3>
                <Button variant="ghost" size="sm" onClick={addRisk}>
                  + Add Risk
                </Button>
              </div>

              {risks.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-3 rounded border border-line bg-surface p-3">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                    <span className="text-caption font-semibold text-accent">Risk {idx + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeRisk(idx)}>
                      Remove
                    </Button>
                  </div>
                  <Textarea
                    label="Risk"
                    value={item.risk}
                    onChange={(e) => updateRisk(idx, "risk", e.target.value)}
                    rows={2}
                  />
                  <Textarea
                    label="Mitigation Plan"
                    value={item.mitigation}
                    onChange={(e) => updateRisk(idx, "mitigation", e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
            </div>

            {/* Next Actions Editor */}
            <div className="rounded-lg border border-line bg-bg-sunken p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-small font-semibold text-accent uppercase tracking-wider">
                  Next Actions
                </h3>
                <Button variant="ghost" size="sm" onClick={addNextAction}>
                  + Add Action
                </Button>
              </div>

              {nextActions.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-3 rounded border border-line bg-surface p-3">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                    <span className="text-caption font-semibold text-accent">Action {idx + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeNextAction(idx)}>
                      Remove
                    </Button>
                  </div>
                  <Input
                    label="Action Description"
                    value={item.action}
                    onChange={(e) => updateNextAction(idx, "action", e.target.value)}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      label="When (Deadline/Timeline)"
                      value={item.when}
                      onChange={(e) => updateNextAction(idx, "when", e.target.value)}
                    />
                    <Select
                      label="Effort Level"
                      options={EFFORT_OPTIONS}
                      value={item.effort}
                      onChange={(e) => updateNextAction(idx, "effort", e.target.value as Effort)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Assumptions
              </h3>
              {plan.assumptions && plan.assumptions.length > 0 ? (
                <ul className="flex flex-col gap-2 text-small text-ink">
                  {plan.assumptions.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 rounded border border-line bg-bg-sunken p-3">
                      <span className="text-accent font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-small text-ink-muted">No assumptions listed.</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Risks & Mitigations
              </h3>
              {plan.risks && plan.risks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {plan.risks.map((r, i) => (
                    <div key={i} className="rounded-lg border border-line bg-bg-sunken p-4 flex flex-col gap-2">
                      <div className="flex items-start gap-2 text-small text-ink font-medium">
                        <span className="text-caption uppercase tracking-wider text-ink-muted font-semibold shrink-0">Risk:</span>
                        <span>{r.risk}</span>
                      </div>
                      <div className="flex items-start gap-2 text-small text-ink-secondary border-t border-line/50 pt-2">
                        <span className="text-caption uppercase tracking-wider text-ink-muted font-semibold shrink-0">Mitigation:</span>
                        <span>{r.mitigation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-ink-muted">No risks listed.</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Next Actions
              </h3>
              {plan.next_actions && plan.next_actions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-small text-ink">
                    <thead className="border-b border-line bg-bg-sunken text-caption uppercase text-ink-muted">
                      <tr>
                        <th className="p-3">Action Item</th>
                        <th className="p-3">When</th>
                        <th className="p-3">Effort</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {plan.next_actions.map((act, i) => (
                        <tr key={i} className="hover:bg-surface-hover">
                          <td className="p-3 font-medium text-ink">{act.action}</td>
                          <td className="p-3 text-caption font-mono text-ink-secondary whitespace-nowrap">{act.when}</td>
                          <td className="p-3 whitespace-nowrap">
                            <Badge tone={EFFORT_TONES[act.effort] ?? "neutral"}>
                              {act.effort}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-small text-ink-muted">No next actions listed.</p>
              )}
            </div>
          </div>
        )
      }
    </SectionWrapper>
  );
}
