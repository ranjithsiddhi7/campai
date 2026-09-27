import { useState } from "react";
import type { BudgetCategory, BudgetLineItem } from "../../types/campaign";
import { SectionWrapper } from "./SectionWrapper";
import type { SectionProps } from "./types";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Badge, type BadgeTone } from "../ui/Badge";
import { formatCurrency } from "./utils";

const CATEGORY_OPTIONS = [
  { value: "media", label: "Media" },
  { value: "content", label: "Content" },
  { value: "offer", label: "Offer" },
  { value: "tools", label: "Tools" },
  { value: "contingency", label: "Contingency" },
];

const CATEGORY_TONES: Record<BudgetCategory, BadgeTone> = {
  media: "accent",
  content: "info",
  offer: "warning",
  tools: "neutral",
  contingency: "neutral",
};

export function BudgetSection({ plan, disabled, onSave }: SectionProps) {
  const [currency, setCurrency] = useState(plan.budget?.currency || "SGD");
  const [total, setTotal] = useState<number>(plan.budget?.total || 0);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>(
    plan.budget?.line_items ? JSON.parse(JSON.stringify(plan.budget.line_items)) : []
  );

  const resetForm = () => {
    setCurrency(plan.budget?.currency || "SGD");
    setTotal(plan.budget?.total || 0);
    setLineItems(plan.budget?.line_items ? JSON.parse(JSON.stringify(plan.budget.line_items)) : []);
  };

  const getPatch = () => ({
    budget: {
      currency,
      total: Number(total) || 0,
      line_items: lineItems.map((item) => ({
        ...item,
        amount: Number(item.amount) || 0,
      })),
    },
  });

  const updateLineItem = (index: number, field: keyof BudgetLineItem, value: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { name: "New Budget Line", category: "content", amount: 0, notes: "" },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const computedSum = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalNum = Number(total) || 0;
  const isSumMismatch = computedSum !== totalNum;

  return (
    <SectionWrapper
      sectionKey="budget"
      disabled={disabled}
      onSave={onSave}
      getPatch={getPatch}
      onReset={resetForm}
    >
      {(isEditing) =>
        isEditing ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Currency (ISO code)"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="SGD, USD, EUR, etc."
              />
              <Input
                label="Total Campaign Budget"
                type="number"
                value={total}
                onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="rounded-lg border border-line bg-bg-sunken p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-small font-semibold text-accent uppercase tracking-wider">
                  Budget Line Items ({lineItems.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={addLineItem}>
                  + Add Line Item
                </Button>
              </div>

              {lineItems.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-3 rounded border border-line bg-surface p-3">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                    <span className="text-caption font-semibold text-accent">Item {idx + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeLineItem(idx)}>
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Input
                      label="Item Name"
                      value={item.name}
                      onChange={(e) => updateLineItem(idx, "name", e.target.value)}
                    />
                    <Select
                      label="Category"
                      options={CATEGORY_OPTIONS}
                      value={item.category}
                      onChange={(e) => updateLineItem(idx, "category", e.target.value as BudgetCategory)}
                    />
                    <Input
                      label={`Amount (${currency})`}
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateLineItem(idx, "amount", parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <Input
                    label="Notes"
                    value={item.notes}
                    onChange={(e) => updateLineItem(idx, "notes", e.target.value)}
                    placeholder="Details about this cost line"
                  />
                </div>
              ))}

              <div className="mt-2 border-t border-line pt-3 flex flex-col gap-1">
                <div className="flex items-center justify-between text-small font-semibold text-ink">
                  <span>Computed Line Items Sum:</span>
                  <span className="font-mono text-accent">{formatCurrency(computedSum, currency)}</span>
                </div>
                {isSumMismatch && (
                  <p className="text-caption text-state-warning">
                    Line items add up to {formatCurrency(computedSum, currency)}, your budget is {formatCurrency(totalNum, currency)}.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-baseline justify-between rounded-lg border border-line bg-bg-sunken p-5">
              <div>
                <span className="text-caption uppercase tracking-wider text-ink-muted font-semibold">
                  Total Budget
                </span>
                <div className="text-display font-semibold text-accent">
                  {formatCurrency(plan.budget?.total || 0, plan.budget?.currency || "SGD")}
                </div>
              </div>
              <span className="text-caption font-mono uppercase text-ink-secondary">
                Currency: {plan.budget?.currency || "SGD"}
              </span>
            </div>

            {plan.budget?.line_items && plan.budget.line_items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-small text-ink">
                  <thead className="border-b border-line bg-bg-sunken text-caption uppercase text-ink-muted">
                    <tr>
                      <th className="p-3">Category</th>
                      <th className="p-3">Line Item</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {plan.budget.line_items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover">
                        <td className="p-3 whitespace-nowrap">
                          <Badge tone={CATEGORY_TONES[item.category] ?? "neutral"}>
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium text-ink">{item.name}</td>
                        <td className="p-3 text-right font-mono text-caption font-semibold text-ink whitespace-nowrap">
                          {formatCurrency(item.amount, plan.budget?.currency || "SGD")}
                        </td>
                        <td className="p-3 text-caption text-ink-muted">{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-line-strong bg-bg-sunken font-semibold text-ink">
                    <tr>
                      <td colSpan={2} className="p-3">Total Sum of Line Items</td>
                      <td className="p-3 text-right font-mono text-caption text-accent">
                        {formatCurrency(
                          plan.budget.line_items.reduce((acc, it) => acc + (it.amount || 0), 0),
                          plan.budget?.currency || "SGD"
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-small text-ink-muted">No budget line items listed.</p>
            )}
          </div>
        )
      }
    </SectionWrapper>
  );
}
