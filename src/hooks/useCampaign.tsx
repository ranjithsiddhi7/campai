// AI note: Campaign workspace state: load campaign + brief + latest plan + calendar rows, section edits, calendar edits, revision Apply/Discard. React context + hook, no state library.
// Destination: src/hooks/useCampaign.tsx. Owner: Bolt creates it from this snippet in prompts H6–H9; Claude Code may fix it while Bolt is idle.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  CalendarItemRow,
  CampaignBriefRow,
  CampaignPlan,
  CampaignPlanRow,
  CampaignRow,
  ReviseResponse,
  SectionKey,
  ValidationFlag,
} from "../types/campaign";
import {
  addCalendarItem,
  applyRevision,
  deleteCalendarItem,
  discardRevision,
  getBrief,
  getCampaign,
  getLatestPlan,
  listCalendarItems,
  savePlan,
  updateCalendarItem,
  type CalendarItemPatch,
} from "../lib/campaigns";
import { AiClientError, generateCampaign, newRequestId, reviseCampaign } from "../lib/api";

export type SectionPatch = Partial<Pick<CampaignPlan, keyof CampaignPlan>>;

interface CampaignState {
  campaign: CampaignRow | null;
  brief: CampaignBriefRow | null;
  plan: CampaignPlan | null;
  planVersion: number;
  flags: ValidationFlag[];
  calendar: CalendarItemRow[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  notFound: boolean;

  reload: () => Promise<void>;

  // Generation
  generating: boolean;
  generate: () => Promise<void>;
  /** C1b addition: the last failed generate() call (code + safe message). Survives reload(); cleared when generate() starts or succeeds. */
  generateError: { code: string; message: string } | null;

  // Editing (no AI)
  saveSection: (patch: SectionPatch) => Promise<void>;
  editCalendarItem: (itemId: string, patch: CalendarItemPatch) => Promise<void>;
  createCalendarItem: (item: CalendarItemPatch) => Promise<void>;
  removeCalendarItem: (itemId: string) => Promise<void>;

  // Revision
  lockedSections: SectionKey[];
  toggleLock: (key: SectionKey) => void;
  revising: boolean;
  proposal: ReviseResponse | null;
  /** R1 addition: the last failed requestRevision() call (code + safe message), shown under the ReviseBar. Cleared when a revision starts. */
  reviseError: { code: string; message: string } | null;
  requestRevision: (instruction: string) => Promise<void>;
  applyProposal: () => Promise<void>;
  discardProposal: () => Promise<void>;
}

const CampaignContext = createContext<CampaignState | null>(null);

export function CampaignProvider({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  const [campaign, setCampaign] = useState<CampaignRow | null>(null);
  const [brief, setBrief] = useState<CampaignBriefRow | null>(null);
  const [planRow, setPlanRow] = useState<CampaignPlanRow | null>(null);
  const [calendar, setCalendar] = useState<CalendarItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<{ code: string; message: string } | null>(null);
  const generateRequestId = useRef<string>(newRequestId());

  const [lockedSections, setLocked] = useState<SectionKey[]>([]);
  const [revising, setRevising] = useState(false);
  const [proposal, setProposal] = useState<ReviseResponse | null>(null);
  const [reviseError, setReviseError] = useState<{ code: string; message: string } | null>(null);
  const reviseRequestId = useRef<string>(newRequestId());

  const reload = useCallback(async () => {
    setError(null);
    try {
      const c = await getCampaign(campaignId);
      if (!c) {
        setNotFound(true);
        return;
      }
      setCampaign(c);
      const [b, p, items] = await Promise.all([getBrief(campaignId), getLatestPlan(campaignId), listCalendarItems(campaignId)]);
      setBrief(b);
      setPlanRow(p);
      setCalendar(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this campaign.");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  // Every write goes through the database helper functions, then we reload the plan and rows so state
  // always mirrors what is saved (simple and correct; the tables are small).
  const withSaving = useCallback(
    async (work: () => Promise<void>) => {
      setSaving(true);
      setError(null);
      try {
        await work();
        await reload();
      } catch (e) {
        setError(e instanceof AiClientError || e instanceof Error ? e.message : "Something went wrong saving your change.");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setGenerateError(null);
    try {
      await generateCampaign({ campaignId, requestId: generateRequestId.current });
      generateRequestId.current = newRequestId();
      await reload();
    } catch (e) {
      if (e instanceof AiClientError && e.code === "duplicate_request") {
        // The earlier attempt finished (or is finishing); reload shows the saved result.
        generateRequestId.current = newRequestId();
        await reload();
      } else {
        setError(e instanceof AiClientError ? e.message : "Something went wrong building your campaign.");
        setGenerateError({
          code: e instanceof AiClientError ? e.code : "unknown",
          message: e instanceof AiClientError ? e.message : "Something went wrong building your campaign.",
        });
        // Keep the same request_id only when we cannot know whether the server finished (timeout / network):
        // a replay then returns the earlier result. After any server-reported failure the ledger already holds
        // that request_id, so a retry must use a fresh id or it would get 409 duplicate_request.
        if (!(e instanceof AiClientError) || (e.code !== "timeout" && e.code !== "network")) {
          generateRequestId.current = newRequestId();
        }
        await reload(); // picks up campaigns.status = 'error' and last_error
      }
    } finally {
      setGenerating(false);
    }
  }, [campaignId, reload]);

  const saveSection = useCallback(
    (patch: SectionPatch) =>
      withSaving(async () => {
        if (!planRow) throw new Error("There is no plan to edit yet.");
        const next: CampaignPlan = { ...planRow.plan, ...patch };
        await savePlan(campaignId, next, planRow.flags);
      }),
    [campaignId, planRow, withSaving],
  );

  const editCalendarItem = useCallback((itemId: string, patch: CalendarItemPatch) => withSaving(() => updateCalendarItem(itemId, patch).then(() => undefined)), [withSaving]);
  const createCalendarItem = useCallback((item: CalendarItemPatch) => withSaving(() => addCalendarItem(campaignId, item).then(() => undefined)), [campaignId, withSaving]);
  const removeCalendarItem = useCallback((itemId: string) => withSaving(() => deleteCalendarItem(itemId).then(() => undefined)), [withSaving]);

  const toggleLock = useCallback((key: SectionKey) => {
    setLocked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }, []);

  const requestRevision = useCallback(
    async (instruction: string) => {
      setRevising(true);
      setError(null);
      setReviseError(null);
      try {
        const res = await reviseCampaign({ campaignId, instruction, lockedSections, requestId: reviseRequestId.current });
        reviseRequestId.current = newRequestId();
        setProposal(res);
      } catch (e) {
        // Shown under the ReviseBar only (not in the workspace-level error), so it needs its code.
        setReviseError({
          code: e instanceof AiClientError ? e.code : "unknown",
          message: e instanceof AiClientError ? e.message : "Something went wrong revising your campaign.",
        });
        // Same rule as generate(): keep the id only after timeout / network, otherwise rotate it.
        if (!(e instanceof AiClientError) || (e.code !== "timeout" && e.code !== "network")) {
          reviseRequestId.current = newRequestId();
        }
      } finally {
        setRevising(false);
      }
    },
    [campaignId, lockedSections],
  );

  const applyProposal = useCallback(async () => {
    if (!proposal) return;
    await withSaving(async () => {
      await applyRevision(proposal.revision_id);
      setProposal(null);
    });
  }, [proposal, withSaving]);

  const discardProposal = useCallback(async () => {
    if (!proposal) return;
    await withSaving(async () => {
      await discardRevision(proposal.revision_id);
      setProposal(null);
    });
  }, [proposal, withSaving]);

  const value = useMemo<CampaignState>(
    () => ({
      campaign,
      brief,
      plan: planRow?.plan ?? null,
      planVersion: planRow?.version ?? 0,
      flags: planRow?.flags ?? [],
      calendar,
      loading,
      saving,
      error,
      notFound,
      reload,
      generating,
      generate,
      generateError,
      saveSection,
      editCalendarItem,
      createCalendarItem,
      removeCalendarItem,
      lockedSections,
      toggleLock,
      revising,
      proposal,
      reviseError,
      requestRevision,
      applyProposal,
      discardProposal,
    }),
    [campaign, brief, planRow, calendar, loading, saving, error, notFound, reload, generating, generate, generateError, saveSection, editCalendarItem, createCalendarItem, removeCalendarItem, lockedSections, toggleLock, revising, proposal, reviseError, requestRevision, applyProposal, discardProposal],
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign(): CampaignState {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error("useCampaign must be used inside <CampaignProvider>");
  return ctx;
}
