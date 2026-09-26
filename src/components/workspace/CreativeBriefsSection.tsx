import { useState } from "react";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { arrayToLines, linesToArray } from "./utils";

interface CreativeBriefFormState {
  title: string;
  purpose: string;
  format: string;
  key_message: string;
  visual_direction: string;
  deliverablesText: string;
  due_date: string;
}

export function CreativeBriefsSection({ plan, disabled, onSave }: SectionProps) {
  const [briefs, setBriefs] = useState<CreativeBriefFormState[]>(
    (plan.creative_briefs || []).map((b) => ({
      title: b.title,
      purpose: b.purpose,
      format: b.format,
      key_message: b.key_message,
      visual_direction: b.visual_direction,
      deliverablesText: arrayToLines(b.deliverables),
      due_date: b.due_date,
    }))
  );

  const resetForm = () => {
    setBriefs(
      (plan.creative_briefs || []).map((b) => ({
        title: b.title,
        purpose: b.purpose,
        format: b.format,
        key_message: b.key_message,
        visual_direction: b.visual_direction,
        deliverablesText: arrayToLines(b.deliverables),
        due_date: b.due_date,
      }))
    );
  };

  const getPatch = () => ({
    creative_briefs: briefs.map((b) => ({
      title: b.title,
      purpose: b.purpose,
      format: b.format,
      key_message: b.key_message,
      visual_direction: b.visual_direction,
      deliverables: linesToArray(b.deliverablesText),
      due_date: b.due_date,
    })),
  });

  const updateBrief = (index: number, field: keyof CreativeBriefFormState, value: string) => {
    setBriefs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addBrief = () => {
    setBriefs((prev) => [
      ...prev,
      {
        title: "New Creative Brief",
        purpose: "",
        format: "",
        key_message: "",
        visual_direction: "",
        deliverablesText: "",
        due_date: "",
      },
    ]);
  };

  const removeBrief = (index: number) => {
    setBriefs((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SectionWrapper
      sectionKey="creative_briefs"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-small font-medium text-ink">Creative Briefs ({briefs.length})</span>
              <Button variant="ghost" size="sm" onClick={addBrief}>
                + Add Creative Brief
              </Button>
            </div>

            {briefs.map((b, idx) => (
              <div key={idx} className="flex flex-col gap-4 rounded-lg border border-line bg-bg-sunken p-4">
                <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                  <span className="text-caption font-semibold text-accent">Brief {idx + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeBrief(idx)}>
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="Brief Title"
                    value={b.title}
                    onChange={(e) => updateBrief(idx, "title", e.target.value)}
                  />
                  <Input
                    label="Format"
                    value={b.format}
                    onChange={(e) => updateBrief(idx, "format", e.target.value)}
                  />
                  <Input
                    label="Due Date"
                    type="date"
                    value={b.due_date}
                    onChange={(e) => updateBrief(idx, "due_date", e.target.value)}
                  />
                </div>

                <Textarea
                  label="Purpose"
                  value={b.purpose}
                  onChange={(e) => updateBrief(idx, "purpose", e.target.value)}
                  rows={2}
                />

                <Textarea
                  label="Key Message"
                  value={b.key_message}
                  onChange={(e) => updateBrief(idx, "key_message", e.target.value)}
                  rows={2}
                />

                <Textarea
                  label="Visual Direction"
                  value={b.visual_direction}
                  onChange={(e) => updateBrief(idx, "visual_direction", e.target.value)}
                  rows={2}
                />

                <Textarea
                  label="Deliverables (one per line)"
                  value={b.deliverablesText}
                  onChange={(e) => updateBrief(idx, "deliverablesText", e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plan.creative_briefs && plan.creative_briefs.length > 0 ? (
              plan.creative_briefs.map((brief, idx) => (
                <div key={idx} className="flex flex-col justify-between rounded-lg border border-line bg-bg-sunken p-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                      <div>
                        <h3 className="text-h3 font-semibold text-ink">{brief.title}</h3>
                        <span className="text-caption font-mono text-ink-muted">{brief.format}</span>
                      </div>
                      {brief.due_date && (
                        <span className="text-caption font-mono text-accent whitespace-nowrap">
                          Due {brief.due_date}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-caption font-semibold uppercase text-ink-muted">Purpose</span>
                      <p className="mt-1 text-small text-ink">{brief.purpose}</p>
                    </div>

                    <div>
                      <span className="text-caption font-semibold uppercase text-ink-muted">Key Message</span>
                      <p className="mt-1 text-small font-medium text-ink">{brief.key_message}</p>
                    </div>

                    <div>
                      <span className="text-caption font-semibold uppercase text-ink-muted">Visual Direction</span>
                      <p className="mt-1 text-small text-ink-secondary">{brief.visual_direction}</p>
                    </div>

                    {brief.deliverables && brief.deliverables.length > 0 && (
                      <div>
                        <span className="text-caption font-semibold uppercase text-ink-muted">Deliverables</span>
                        <ul className="mt-1 flex flex-col gap-1 text-small text-ink">
                          {brief.deliverables.map((deliv, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-accent">•</span>
                              <span>{deliv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-small text-ink-muted col-span-2">No creative briefs defined.</p>
            )}
          </div>
        )
      }
    </SectionWrapper>
  );
}
