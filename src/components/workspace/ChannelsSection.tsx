import { useState } from "react";
import type { Channel, ChannelPriority } from "../../types/campaign";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Badge, type BadgeTone } from "../ui/Badge";

const PRIORITY_OPTIONS = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "support", label: "Support" },
];

const PRIORITY_TONES: Record<ChannelPriority, BadgeTone> = {
  primary: "accent",
  secondary: "info",
  support: "neutral",
};

export function ChannelsSection({ plan, disabled, onSave }: SectionProps) {
  const [channels, setChannels] = useState<Channel[]>(plan.channels || []);

  const resetForm = () => {
    setChannels(plan.channels ? JSON.parse(JSON.stringify(plan.channels)) : []);
  };

  const getPatch = () => ({
    channels,
  });

  const updateChannel = (index: number, field: keyof Channel, value: string | number) => {
    setChannels((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addChannel = () => {
    setChannels((prev) => [
      ...prev,
      { name: "New Channel", role: "", priority: "secondary", budget_share_percent: 0, why: "" },
    ]);
  };

  const removeChannel = (index: number) => {
    setChannels((prev) => prev.filter((_, i) => i !== index));
  };

  const totalShare = channels.reduce((sum, ch) => sum + (Number(ch.budget_share_percent) || 0), 0);

  return (
    <SectionWrapper
      sectionKey="channels"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-small font-medium text-ink">
                Total Budget Share: <span className={totalShare === 100 ? "text-state-success" : "text-state-warning"}>{totalShare}%</span>
              </span>
              <Button variant="ghost" size="sm" onClick={addChannel}>
                + Add Channel
              </Button>
            </div>

            {channels.map((ch, idx) => (
              <div key={idx} className="flex flex-col gap-4 rounded-lg border border-line bg-bg-sunken p-4">
                <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                  <span className="text-caption font-semibold text-accent">Channel {idx + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeChannel(idx)}>
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="Channel Name"
                    value={ch.name}
                    onChange={(e) => updateChannel(idx, "name", e.target.value)}
                  />
                  <Select
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    value={ch.priority}
                    onChange={(e) => updateChannel(idx, "priority", e.target.value as ChannelPriority)}
                  />
                  <Input
                    label="Budget Share (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={ch.budget_share_percent}
                    onChange={(e) => updateChannel(idx, "budget_share_percent", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <Input
                  label="Role"
                  value={ch.role}
                  onChange={(e) => updateChannel(idx, "role", e.target.value)}
                />

                <Textarea
                  label="Why this channel?"
                  value={ch.why}
                  onChange={(e) => updateChannel(idx, "why", e.target.value)}
                  rows={2}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {plan.channels && plan.channels.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-small text-ink">
                  <thead className="border-b border-line bg-bg-sunken text-caption uppercase text-ink-muted">
                    <tr>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Budget Share</th>
                      <th className="p-3">Role & Why</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {plan.channels.map((ch, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover">
                        <td className="p-3 font-medium text-ink whitespace-nowrap">{ch.name}</td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge tone={PRIORITY_TONES[ch.priority] ?? "neutral"}>
                            {ch.priority}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-caption text-ink-secondary whitespace-nowrap">
                          {ch.budget_share_percent}%
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-ink">{ch.role}</p>
                          <p className="mt-1 text-caption text-ink-muted">{ch.why}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-small text-ink-muted">No channels defined.</p>
            )}
          </div>
        )
      }
    </SectionWrapper>
  );
}
