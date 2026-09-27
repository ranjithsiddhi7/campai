import { useState } from "react";
import type { AudienceSegment } from "../../types/campaign";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { arrayToLines, linesToArray } from "./utils";

function defaultSegment(name: string): AudienceSegment {
  return {
    name,
    description: "",
    pains: [],
    motivations: [],
    objections: [],
  };
}

export function AudienceSection({ plan, disabled, onSave }: SectionProps) {
  const [primary, setPrimary] = useState<AudienceSegment>(plan.audience?.primary || defaultSegment("Primary Segment"));
  const [secondary, setSecondary] = useState<AudienceSegment>(plan.audience?.secondary || defaultSegment("Secondary Segment"));

  // Form strings for multi-line inputs
  const [primaryPains, setPrimaryPains] = useState(arrayToLines(plan.audience?.primary?.pains));
  const [primaryMotivations, setPrimaryMotivations] = useState(arrayToLines(plan.audience?.primary?.motivations));
  const [primaryObjections, setPrimaryObjections] = useState(arrayToLines(plan.audience?.primary?.objections));

  const [secondaryPains, setSecondaryPains] = useState(arrayToLines(plan.audience?.secondary?.pains));
  const [secondaryMotivations, setSecondaryMotivations] = useState(arrayToLines(plan.audience?.secondary?.motivations));
  const [secondaryObjections, setSecondaryObjections] = useState(arrayToLines(plan.audience?.secondary?.objections));

  const resetForm = () => {
    const p = plan.audience?.primary || defaultSegment("Primary Segment");
    const s = plan.audience?.secondary || defaultSegment("Secondary Segment");
    setPrimary({ ...p });
    setSecondary({ ...s });
    setPrimaryPains(arrayToLines(p.pains));
    setPrimaryMotivations(arrayToLines(p.motivations));
    setPrimaryObjections(arrayToLines(p.objections));
    setSecondaryPains(arrayToLines(s.pains));
    setSecondaryMotivations(arrayToLines(s.motivations));
    setSecondaryObjections(arrayToLines(s.objections));
  };

  const getPatch = () => ({
    audience: {
      primary: {
        ...primary,
        pains: linesToArray(primaryPains),
        motivations: linesToArray(primaryMotivations),
        objections: linesToArray(primaryObjections),
      },
      secondary: {
        ...secondary,
        pains: linesToArray(secondaryPains),
        motivations: linesToArray(secondaryMotivations),
        objections: linesToArray(secondaryObjections),
      },
    },
  });

  const renderSegmentView = (title: string, segment?: AudienceSegment) => {
    if (!segment) return null;
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-line bg-bg-sunken p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-h3 font-semibold text-ink">{segment.name || title}</h3>
          <span className="text-caption font-mono uppercase tracking-wider text-accent">{title}</span>
        </div>
        <p className="text-body text-ink-secondary">{segment.description || "No description provided."}</p>

        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <h4 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
              Pain Points
            </h4>
            {segment.pains && segment.pains.length > 0 ? (
              <ul className="flex flex-col gap-1.5 text-small text-ink">
                {segment.pains.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-ink-muted">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-caption text-ink-muted">None listed.</p>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
              Motivations
            </h4>
            {segment.motivations && segment.motivations.length > 0 ? (
              <ul className="flex flex-col gap-1.5 text-small text-ink">
                {segment.motivations.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-ink-muted">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-caption text-ink-muted">None listed.</p>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
              Objections
            </h4>
            {segment.objections && segment.objections.length > 0 ? (
              <ul className="flex flex-col gap-1.5 text-small text-ink">
                {segment.objections.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-ink-muted">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-caption text-ink-muted">None listed.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <SectionWrapper
      sectionKey="audience"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-6">
            {/* Primary Editor */}
            <div className="rounded-lg border border-line bg-bg-sunken p-4 flex flex-col gap-4">
              <h3 className="text-small font-semibold text-accent uppercase tracking-wider">
                Primary Audience Segment
              </h3>
              <Input
                label="Segment Name"
                value={primary.name}
                onChange={(e) => setPrimary({ ...primary, name: e.target.value })}
              />
              <Textarea
                label="Description"
                value={primary.description}
                onChange={(e) => setPrimary({ ...primary, description: e.target.value })}
                rows={3}
              />
              <Textarea
                label="Pain Points (one per line)"
                value={primaryPains}
                onChange={(e) => setPrimaryPains(e.target.value)}
                rows={3}
              />
              <Textarea
                label="Motivations (one per line)"
                value={primaryMotivations}
                onChange={(e) => setPrimaryMotivations(e.target.value)}
                rows={3}
              />
              <Textarea
                label="Objections (one per line)"
                value={primaryObjections}
                onChange={(e) => setPrimaryObjections(e.target.value)}
                rows={3}
              />
            </div>

            {/* Secondary Editor */}
            <div className="rounded-lg border border-line bg-bg-sunken p-4 flex flex-col gap-4">
              <h3 className="text-small font-semibold text-accent uppercase tracking-wider">
                Secondary Audience Segment
              </h3>
              <Input
                label="Segment Name"
                value={secondary.name}
                onChange={(e) => setSecondary({ ...secondary, name: e.target.value })}
              />
              <Textarea
                label="Description"
                value={secondary.description}
                onChange={(e) => setSecondary({ ...secondary, description: e.target.value })}
                rows={3}
              />
              <Textarea
                label="Pain Points (one per line)"
                value={secondaryPains}
                onChange={(e) => setSecondaryPains(e.target.value)}
                rows={3}
              />
              <Textarea
                label="Motivations (one per line)"
                value={secondaryMotivations}
                onChange={(e) => setSecondaryMotivations(e.target.value)}
                rows={3}
              />
              <Textarea
                label="Objections (one per line)"
                value={secondaryObjections}
                onChange={(e) => setSecondaryObjections(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {renderSegmentView("Primary Audience", plan.audience?.primary)}
            {renderSegmentView("Secondary Audience", plan.audience?.secondary)}
          </div>
        )
      }
    </SectionWrapper>
  );
}
