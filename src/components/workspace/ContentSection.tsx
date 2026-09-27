import { useState } from "react";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { arrayToLines, linesToArray } from "./utils";

interface PillarFormState {
  name: string;
  description: string;
  ideasText: string;
}

export function ContentSection({ plan, disabled, onSave }: SectionProps) {
  const [pillars, setPillars] = useState<PillarFormState[]>(
    (plan.content_pillars || []).map((p) => ({
      name: p.name,
      description: p.description,
      ideasText: arrayToLines(p.ideas),
    }))
  );

  const resetForm = () => {
    setPillars(
      (plan.content_pillars || []).map((p) => ({
        name: p.name,
        description: p.description,
        ideasText: arrayToLines(p.ideas),
      }))
    );
  };

  const getPatch = () => ({
    content_pillars: pillars.map((p) => ({
      name: p.name,
      description: p.description,
      ideas: linesToArray(p.ideasText),
    })),
  });

  const updatePillar = (index: number, field: keyof PillarFormState, value: string) => {
    setPillars((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPillar = () => {
    setPillars((prev) => [...prev, { name: "New Pillar", description: "", ideasText: "" }]);
  };

  const removePillar = (index: number) => {
    setPillars((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SectionWrapper
      sectionKey="content"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-small font-medium text-ink">Content Pillars ({pillars.length})</span>
              <Button variant="ghost" size="sm" onClick={addPillar}>
                + Add Pillar
              </Button>
            </div>

            {pillars.map((p, idx) => (
              <div key={idx} className="flex flex-col gap-4 rounded-lg border border-line bg-bg-sunken p-4">
                <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                  <span className="text-caption font-semibold text-accent">Pillar {idx + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removePillar(idx)}>
                    Remove
                  </Button>
                </div>

                <Input
                  label="Pillar Name"
                  value={p.name}
                  onChange={(e) => updatePillar(idx, "name", e.target.value)}
                />

                <Textarea
                  label="Description"
                  value={p.description}
                  onChange={(e) => updatePillar(idx, "description", e.target.value)}
                  rows={2}
                />

                <Textarea
                  label="Content Ideas (one per line)"
                  value={p.ideasText}
                  onChange={(e) => updatePillar(idx, "ideasText", e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plan.content_pillars && plan.content_pillars.length > 0 ? (
              plan.content_pillars.map((pillar, idx) => (
                <div key={idx} className="flex flex-col justify-between rounded-lg border border-line bg-bg-sunken p-5">
                  <div>
                    <h3 className="text-h3 font-semibold text-ink mb-1">{pillar.name}</h3>
                    <p className="text-small text-ink-secondary mb-4">{pillar.description}</p>

                    <h4 className="text-caption uppercase tracking-wider text-ink-muted font-semibold mb-2">
                      Content Ideas
                    </h4>
                    {pillar.ideas && pillar.ideas.length > 0 ? (
                      <ul className="flex flex-col gap-1.5 text-small text-ink">
                        {pillar.ideas.map((idea, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-accent">•</span>
                            <span>{idea}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-caption text-ink-muted">No ideas listed.</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-small text-ink-muted col-span-2">No content pillars defined.</p>
            )}
          </div>
        )
      }
    </SectionWrapper>
  );
}
