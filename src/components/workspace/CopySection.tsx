import { useState } from "react";
import type { AdScript, EmailOrMessageCopy } from "../../types/campaign";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { arrayToLines, linesToArray } from "./utils";

export function CopySection({ plan, disabled, onSave }: SectionProps) {
  const [headlinesText, setHeadlinesText] = useState(arrayToLines(plan.copy?.headline_options));
  const [captionsText, setCaptionsText] = useState(arrayToLines(plan.copy?.social_captions));
  const [emailCopies, setEmailCopies] = useState<EmailOrMessageCopy[]>(
    plan.copy?.email_or_message_copy ? JSON.parse(JSON.stringify(plan.copy.email_or_message_copy)) : []
  );
  const [adScripts, setAdScripts] = useState<AdScript[]>(
    plan.ad_scripts ? JSON.parse(JSON.stringify(plan.ad_scripts)) : []
  );

  const resetForm = () => {
    setHeadlinesText(arrayToLines(plan.copy?.headline_options));
    setCaptionsText(arrayToLines(plan.copy?.social_captions));
    setEmailCopies(plan.copy?.email_or_message_copy ? JSON.parse(JSON.stringify(plan.copy.email_or_message_copy)) : []);
    setAdScripts(plan.ad_scripts ? JSON.parse(JSON.stringify(plan.ad_scripts)) : []);
  };

  const getPatch = () => ({
    copy: {
      headline_options: linesToArray(headlinesText),
      social_captions: linesToArray(captionsText),
      email_or_message_copy: emailCopies,
    },
    ad_scripts: adScripts,
  });

  const updateEmailCopy = (index: number, field: keyof EmailOrMessageCopy, value: string) => {
    setEmailCopies((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addEmailCopy = () => {
    setEmailCopies((prev) => [...prev, { purpose: "", subject: "", body: "" }]);
  };

  const removeEmailCopy = (index: number) => {
    setEmailCopies((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAdScript = (index: number, field: keyof AdScript, value: string | number) => {
    setAdScripts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addAdScript = () => {
    setAdScripts((prev) => [
      ...prev,
      { title: "New Ad Script", channel: "Instagram", duration_seconds: 15, script: "", visual_notes: "" },
    ]);
  };

  const removeAdScript = (index: number) => {
    setAdScripts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SectionWrapper
      sectionKey="copy"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-6">
            <Textarea
              label="Headline Options (one per line)"
              value={headlinesText}
              onChange={(e) => setHeadlinesText(e.target.value)}
              rows={4}
            />

            <Textarea
              label="Social Captions (one per line)"
              value={captionsText}
              onChange={(e) => setCaptionsText(e.target.value)}
              rows={5}
            />

            {/* Email Copies Editor */}
            <div className="rounded-lg border border-line bg-bg-sunken p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-small font-semibold text-accent uppercase tracking-wider">
                  Email & Message Copies
                </h3>
                <Button variant="ghost" size="sm" onClick={addEmailCopy}>
                  + Add Email/Message
                </Button>
              </div>

              {emailCopies.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-3 rounded border border-line bg-surface p-3">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                    <span className="text-caption font-semibold text-accent">Message {idx + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeEmailCopy(idx)}>
                      Remove
                    </Button>
                  </div>
                  <Input
                    label="Purpose"
                    value={item.purpose}
                    onChange={(e) => updateEmailCopy(idx, "purpose", e.target.value)}
                  />
                  <Input
                    label="Subject Line"
                    value={item.subject}
                    onChange={(e) => updateEmailCopy(idx, "subject", e.target.value)}
                  />
                  <Textarea
                    label="Message Body"
                    value={item.body}
                    onChange={(e) => updateEmailCopy(idx, "body", e.target.value)}
                    rows={4}
                  />
                </div>
              ))}
            </div>

            {/* Ad Scripts Editor */}
            <div className="rounded-lg border border-line bg-bg-sunken p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-small font-semibold text-accent uppercase tracking-wider">
                  Ad & Reel Scripts
                </h3>
                <Button variant="ghost" size="sm" onClick={addAdScript}>
                  + Add Script
                </Button>
              </div>

              {adScripts.map((script, idx) => (
                <div key={idx} className="flex flex-col gap-3 rounded border border-line bg-surface p-3">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                    <span className="text-caption font-semibold text-accent">Ad Script {idx + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeAdScript(idx)}>
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Input
                      label="Title"
                      value={script.title}
                      onChange={(e) => updateAdScript(idx, "title", e.target.value)}
                    />
                    <Input
                      label="Channel"
                      value={script.channel}
                      onChange={(e) => updateAdScript(idx, "channel", e.target.value)}
                    />
                    <Input
                      label="Duration (seconds)"
                      type="number"
                      value={script.duration_seconds}
                      onChange={(e) => updateAdScript(idx, "duration_seconds", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Textarea
                    label="Visual Notes"
                    value={script.visual_notes}
                    onChange={(e) => updateAdScript(idx, "visual_notes", e.target.value)}
                    rows={2}
                  />
                  <Textarea
                    label="Script Content"
                    value={script.script}
                    onChange={(e) => updateAdScript(idx, "script", e.target.value)}
                    rows={4}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Headline Options
              </h3>
              {plan.copy?.headline_options && plan.copy.headline_options.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {plan.copy.headline_options.map((headline, i) => (
                    <div key={i} className="rounded border border-line bg-bg-sunken p-3 text-body font-medium text-ink">
                      "{headline}"
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-ink-muted">No headline options listed.</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Social Captions
              </h3>
              {plan.copy?.social_captions && plan.copy.social_captions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {plan.copy.social_captions.map((caption, i) => (
                    <div key={i} className="rounded-md border border-line bg-bg-sunken p-4 text-small text-ink leading-relaxed whitespace-pre-line">
                      {caption}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-ink-muted">No social captions listed.</p>
              )}
            </div>

            {plan.copy?.email_or_message_copy && plan.copy.email_or_message_copy.length > 0 && (
              <div>
                <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                  Email & Messaging Copy
                </h3>
                <div className="flex flex-col gap-4">
                  {plan.copy.email_or_message_copy.map((item, i) => (
                    <div key={i} className="rounded-lg border border-line bg-bg-sunken p-4">
                      <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                        <span className="text-small font-semibold text-accent">{item.purpose}</span>
                      </div>
                      <p className="text-small font-semibold text-ink mb-2">Subject: {item.subject}</p>
                      <div className="rounded bg-surface p-3 text-caption font-mono text-ink-secondary whitespace-pre-line">
                        {item.body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.ad_scripts && plan.ad_scripts.length > 0 && (
              <div>
                <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                  Ad & Reel Scripts
                </h3>
                <div className="flex flex-col gap-4">
                  {plan.ad_scripts.map((ad, i) => (
                    <div key={i} className="rounded-lg border border-line bg-bg-sunken p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 mb-3">
                        <h4 className="text-small font-semibold text-ink">{ad.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-caption font-mono text-ink-muted">{ad.channel}</span>
                          <span className="text-caption font-mono text-accent">{ad.duration_seconds}s</span>
                        </div>
                      </div>

                      {ad.visual_notes && (
                        <p className="mb-3 text-caption text-ink-secondary italic">
                          Visual notes: {ad.visual_notes}
                        </p>
                      )}

                      <div className="rounded bg-surface p-3 font-mono text-caption text-ink-secondary whitespace-pre-wrap leading-relaxed">
                        {ad.script}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }
    </SectionWrapper>
  );
}
