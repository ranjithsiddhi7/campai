import { useState } from "react";
import type { Kpi, KpiCadence } from "../../types/campaign";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Badge, type BadgeTone } from "../ui/Badge";

const CADENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "end_of_campaign", label: "End of Campaign" },
];

const CADENCE_TONES: Record<KpiCadence, BadgeTone> = {
  daily: "info",
  weekly: "accent",
  end_of_campaign: "neutral",
};

export function KpisSection({ plan, disabled, onSave }: SectionProps) {
  const [kpis, setKpis] = useState<Kpi[]>(
    plan.kpis ? JSON.parse(JSON.stringify(plan.kpis)) : []
  );

  const resetForm = () => {
    setKpis(plan.kpis ? JSON.parse(JSON.stringify(plan.kpis)) : []);
  };

  const getPatch = () => ({
    kpis,
  });

  const updateKpi = (index: number, field: keyof Kpi, value: string) => {
    setKpis((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addKpi = () => {
    setKpis((prev) => [
      ...prev,
      { name: "New KPI", target: "", how_to_measure: "", cadence: "weekly" },
    ]);
  };

  const removeKpi = (index: number) => {
    setKpis((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SectionWrapper
      sectionKey="kpis"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-small font-medium text-ink">Key Performance Indicators ({kpis.length})</span>
              <Button variant="ghost" size="sm" onClick={addKpi}>
                + Add KPI
              </Button>
            </div>

            {kpis.map((kpi, idx) => (
              <div key={idx} className="flex flex-col gap-4 rounded-lg border border-line bg-bg-sunken p-4">
                <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                  <span className="text-caption font-semibold text-accent">KPI {idx + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeKpi(idx)}>
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="KPI Metric Name"
                    value={kpi.name}
                    onChange={(e) => updateKpi(idx, "name", e.target.value)}
                  />
                  <Input
                    label="Target"
                    value={kpi.target}
                    onChange={(e) => updateKpi(idx, "target", e.target.value)}
                  />
                  <Select
                    label="Cadence"
                    options={CADENCE_OPTIONS}
                    value={kpi.cadence}
                    onChange={(e) => updateKpi(idx, "cadence", e.target.value as KpiCadence)}
                  />
                </div>

                <Textarea
                  label="How to Measure"
                  value={kpi.how_to_measure}
                  onChange={(e) => updateKpi(idx, "how_to_measure", e.target.value)}
                  rows={2}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {plan.kpis && plan.kpis.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-small text-ink">
                  <thead className="border-b border-line bg-bg-sunken text-caption uppercase text-ink-muted">
                    <tr>
                      <th className="p-3">Metric Name</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">How to Measure</th>
                      <th className="p-3">Cadence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {plan.kpis.map((kpi, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover">
                        <td className="p-3 font-semibold text-ink whitespace-nowrap">{kpi.name}</td>
                        <td className="p-3 font-medium text-ink">{kpi.target}</td>
                        <td className="p-3 text-small text-ink-secondary">{kpi.how_to_measure}</td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge tone={CADENCE_TONES[kpi.cadence] ?? "neutral"}>
                            {kpi.cadence.replace(/_/g, " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-small text-ink-muted">No KPIs defined.</p>
            )}
          </div>
        )
      }
    </SectionWrapper>
  );
}
