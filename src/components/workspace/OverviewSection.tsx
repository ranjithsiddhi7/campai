import { useState } from "react";
import type { TimelinePhase } from "../../types/campaign";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";

export function OverviewSection({ plan, disabled, onSave }: SectionProps) {
  const [title, setTitle] = useState(plan.title || "");
  const [executiveSummary, setExecutiveSummary] = useState(plan.executive_summary || "");
  const [businessObjective, setBusinessObjective] = useState(plan.business_objective || "");
  const [startDate, setStartDate] = useState(plan.timeline?.start_date || "");
  const [endDate, setEndDate] = useState(plan.timeline?.end_date || "");
  const [phases, setPhases] = useState<TimelinePhase[]>(plan.timeline?.phases || []);

  const resetForm = () => {
    setTitle(plan.title || "");
    setExecutiveSummary(plan.executive_summary || "");
    setBusinessObjective(plan.business_objective || "");
    setStartDate(plan.timeline?.start_date || "");
    setEndDate(plan.timeline?.end_date || "");
    setPhases(plan.timeline?.phases ? JSON.parse(JSON.stringify(plan.timeline.phases)) : []);
  };

  const getPatch = () => ({
    title,
    executive_summary: executiveSummary,
    business_objective: businessObjective,
    timeline: {
      start_date: startDate,
      end_date: endDate,
      phases,
    },
  });

  const updatePhase = (index: number, field: keyof TimelinePhase, value: string) => {
    setPhases((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPhase = () => {
    setPhases((prev) => [
      ...prev,
      { name: `Phase ${prev.length + 1}`, start_date: startDate, end_date: endDate, focus: "" },
    ]);
  };

  const removePhase = (index: number) => {
    setPhases((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SectionWrapper
      sectionKey="overview"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-5">
            <Input
              label="Campaign Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter campaign title"
            />

            <Textarea
              label="Executive Summary"
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              rows={4}
              placeholder="High-level overview of the campaign"
            />

            <Textarea
              label="Business Objective"
              value={businessObjective}
              onChange={(e) => setBusinessObjective(e.target.value)}
              rows={3}
              placeholder="Measurable business goal"
            />

            <div className="rounded-md border border-line bg-bg-sunken p-4">
              <h3 className="mb-3 text-small font-semibold text-ink">Timeline</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-small font-medium text-ink">Timeline Phases</span>
                  <Button variant="ghost" size="sm" onClick={addPhase}>
                    + Add Phase
                  </Button>
                </div>

                {phases.map((phase, idx) => (
                  <div key={idx} className="flex flex-col gap-3 rounded border border-line bg-surface p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-caption font-semibold text-accent">Phase {idx + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removePhase(idx)}>
                        Remove
                      </Button>
                    </div>
                    <Input
                      label="Phase Name"
                      value={phase.name}
                      onChange={(e) => updatePhase(idx, "name", e.target.value)}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        label="Phase Start Date"
                        type="date"
                        value={phase.start_date}
                        onChange={(e) => updatePhase(idx, "start_date", e.target.value)}
                      />
                      <Input
                        label="Phase End Date"
                        type="date"
                        value={phase.end_date}
                        onChange={(e) => updatePhase(idx, "end_date", e.target.value)}
                      />
                    </div>
                    <Input
                      label="Phase Focus"
                      value={phase.focus}
                      onChange={(e) => updatePhase(idx, "focus", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-1 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Executive Summary
              </h3>
              <p className="text-body text-ink leading-relaxed">
                {plan.executive_summary || "No executive summary provided."}
              </p>
            </div>

            <div>
              <h3 className="mb-1 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Business Objective
              </h3>
              <div className="rounded-md border border-line bg-bg-sunken p-4 text-body text-ink">
                {plan.business_objective || "No business objective defined."}
              </div>
            </div>

            {plan.timeline && (
              <div>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-caption uppercase tracking-wider text-ink-muted font-semibold">
                    Timeline & Phases
                  </h3>
                  <span className="text-small font-mono text-ink-secondary">
                    {plan.timeline.start_date} to {plan.timeline.end_date}
                  </span>
                </div>

                {plan.timeline.phases && plan.timeline.phases.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {plan.timeline.phases.map((phase, i) => (
                      <div key={i} className="flex flex-col justify-between rounded-md border border-line bg-bg-sunken p-4">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-small font-semibold text-ink">{phase.name}</span>
                            <span className="text-caption font-mono text-accent">Phase {i + 1}</span>
                          </div>
                          <p className="mt-2 text-small text-ink-secondary">{phase.focus}</p>
                        </div>
                        <div className="mt-3 text-caption font-mono text-ink-muted">
                          {phase.start_date} – {phase.end_date}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-small text-ink-muted">No phases defined.</p>
                )}
              </div>
            )}
          </div>
        )
      }
    </SectionWrapper>
  );
}
