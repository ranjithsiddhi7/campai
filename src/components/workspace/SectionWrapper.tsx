import { useState, type ReactNode } from "react";
import { SECTION_LABELS, type CampaignPlan, type SectionKey } from "../../types/campaign";
import { Button } from "../ui/Button";

interface SectionWrapperProps {
  sectionKey: SectionKey;
  title?: string;
  disabled?: boolean;
  onSave: (patch: Partial<CampaignPlan>) => Promise<void>;
  getPatch: () => Partial<CampaignPlan>;
  onReset: () => void;
  children: (isEditing: boolean) => ReactNode;
}

export function SectionWrapper({
  sectionKey,
  title,
  disabled = false,
  onSave,
  getPatch,
  onReset,
  children,
}: SectionWrapperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayTitle = title ?? SECTION_LABELS[sectionKey];

  const handleEdit = () => {
    setError(null);
    onReset();
    setIsEditing(true);
  };

  const handleCancel = () => {
    setError(null);
    onReset();
    setIsEditing(false);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const patch = getPatch();
      await onSave(patch);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save section changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id={`sec-${sectionKey}`} aria-labelledby={`heading-${sectionKey}`} className="rounded-lg border border-line bg-surface p-5 sm:p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <h2 id={`heading-${sectionKey}`} className="text-h3 font-semibold text-ink">
          {displayTitle}
        </h2>
        <div className="flex items-center gap-2">
          {!isEditing && !disabled && (
            <Button variant="secondary" size="sm" onClick={handleEdit}>
              Edit
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} busy={saving} busyLabel="Saving…">
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-state-danger/40 bg-state-danger/10 px-3 py-2 text-small text-state-danger" role="alert">
          {error}
        </div>
      )}

      {children(isEditing)}
    </section>
  );
}
