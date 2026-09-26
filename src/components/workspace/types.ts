import type { CampaignPlan } from "../../types/campaign";

/**
 * Contract between the Campaign page (src/pages/Campaign.tsx) and every section component.
 * The page passes the validated current plan; onSave receives ONLY that section's fields
 * (see SECTION_FIELDS in src/types/campaign.ts) and saves them as a new plan version.
 * When the patch contains `title`, the page also renames the campaign.
 */
export interface SectionProps {
  plan: CampaignPlan;
  /** True while a save is running or a revision proposal is open: disable Edit/Save. */
  disabled: boolean;
  onSave: (patch: Partial<CampaignPlan>) => Promise<void>;
}
