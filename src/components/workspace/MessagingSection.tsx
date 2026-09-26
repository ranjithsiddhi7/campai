import { useState } from "react";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { arrayToLines, linesToArray } from "./utils";

export function MessagingSection({ plan, disabled, onSave }: SectionProps) {
  const [coreMessage, setCoreMessage] = useState(plan.messaging?.core_message || "");
  const [supportingMessagesText, setSupportingMessagesText] = useState(arrayToLines(plan.messaging?.supporting_messages));

  const [offerName, setOfferName] = useState(plan.offer?.name || "");
  const [offerDescription, setOfferDescription] = useState(plan.offer?.description || "");
  const [offerMechanics, setOfferMechanics] = useState(plan.offer?.mechanics || "");
  const [offerTerms, setOfferTerms] = useState(plan.offer?.terms || "");

  const resetForm = () => {
    setCoreMessage(plan.messaging?.core_message || "");
    setSupportingMessagesText(arrayToLines(plan.messaging?.supporting_messages));
    setOfferName(plan.offer?.name || "");
    setOfferDescription(plan.offer?.description || "");
    setOfferMechanics(plan.offer?.mechanics || "");
    setOfferTerms(plan.offer?.terms || "");
  };

  const getPatch = () => ({
    messaging: {
      core_message: coreMessage,
      supporting_messages: linesToArray(supportingMessagesText),
    },
    offer: {
      name: offerName,
      description: offerDescription,
      mechanics: offerMechanics,
      terms: offerTerms.trim() ? offerTerms : null,
    },
  });

  return (
    <SectionWrapper
      sectionKey="messaging"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-line bg-bg-sunken p-4 flex flex-col gap-4">
              <h3 className="text-small font-semibold text-accent uppercase tracking-wider">
                Messaging
              </h3>
              <Textarea
                label="Core Campaign Message"
                value={coreMessage}
                onChange={(e) => setCoreMessage(e.target.value)}
                rows={3}
              />
              <Textarea
                label="Supporting Messages (one per line)"
                value={supportingMessagesText}
                onChange={(e) => setSupportingMessagesText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="rounded-lg border border-line bg-bg-sunken p-4 flex flex-col gap-4">
              <h3 className="text-small font-semibold text-accent uppercase tracking-wider">
                Campaign Offer
              </h3>
              <Input
                label="Offer Name"
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
              />
              <Textarea
                label="Offer Description"
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                rows={3}
              />
              <Textarea
                label="Offer Mechanics (How it works)"
                value={offerMechanics}
                onChange={(e) => setOfferMechanics(e.target.value)}
                rows={3}
              />
              <Textarea
                label="Terms & Conditions (Optional)"
                value={offerTerms}
                onChange={(e) => setOfferTerms(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Core Message
              </h3>
              <div className="rounded-lg border border-line bg-bg-sunken p-5 text-h2 font-semibold text-ink leading-snug">
                {plan.messaging?.core_message || "No core message specified."}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                Supporting Messages
              </h3>
              {plan.messaging?.supporting_messages && plan.messaging.supporting_messages.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {plan.messaging.supporting_messages.map((msg, i) => (
                    <li key={i} className="flex items-start gap-3 rounded border border-line bg-bg-sunken p-3 text-body text-ink">
                      <span className="text-accent font-bold">•</span>
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-small text-ink-muted">No supporting messages listed.</p>
              )}
            </div>

            {plan.offer && (
              <div>
                <h3 className="mb-2 text-caption uppercase tracking-wider text-ink-muted font-semibold">
                  Campaign Offer
                </h3>
                <div className="rounded-lg border border-line bg-surface-hover p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <h4 className="text-h3 font-semibold text-ink">{plan.offer.name || "Untitled Offer"}</h4>
                    <span className="text-caption font-mono uppercase text-accent">Offer Package</span>
                  </div>

                  <div>
                    <span className="text-caption font-semibold uppercase text-ink-muted">Description</span>
                    <p className="mt-1 text-body text-ink">{plan.offer.description || "—"}</p>
                  </div>

                  <div>
                    <span className="text-caption font-semibold uppercase text-ink-muted">Mechanics</span>
                    <p className="mt-1 text-small text-ink-secondary">{plan.offer.mechanics || "—"}</p>
                  </div>

                  {plan.offer.terms && (
                    <div className="border-t border-line pt-3">
                      <span className="text-caption font-semibold uppercase text-ink-muted">Terms & Conditions</span>
                      <p className="mt-1 text-caption text-ink-muted">{plan.offer.terms}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      }
    </SectionWrapper>
  );
}
