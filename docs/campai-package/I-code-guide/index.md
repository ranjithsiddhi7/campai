<!-- AI note: Part I code guide: project tree, file ownership (Bolt vs Claude Code), where every snippet belongs, commands, and how the pieces fit.
     Owner: Claude Code (docs). Bolt never edits this; humans and both tools read it. -->

# I-code-guide/index.md — Code guide

Acronyms: RLS = Row Level Security; CRUD = Create, Read, Update, Delete; JSON = JavaScript Object Notation; UUID = Universally Unique Identifier; API = Application Programming Interface; UI = User Interface; CLI = Command-Line Interface; CORS = Cross-Origin Resource Sharing; JWT = JSON Web Token.

## 1. Recommended project tree and ownership

```
campai/                                  (GitHub repository root)
├── CLAUDE.md                            Claude Code   ← I-code-guide/CLAUDE.md
├── AGENTS.md                            Claude Code   ← identical copy of CLAUDE.md
├── .env.example                         Claude Code   ← I-code-guide/env.example
├── .gitignore                           Claude Code   (add: .env, .env.local, supabase/.env, supabase/functions/.env, supabase/.env.production)
├── docs/campai-package/                 Claude Code   ← this whole package, read-only reference
├── index.html, vite.config.ts, tsconfig*.json, postcss.config.js   Bolt scaffold (leave as generated)
├── tailwind.config.js                   Bolt          ← I-code-guide/src-snippets/tailwind.config.js (theme only)
├── package.json                         Bolt          (dependencies pinned: react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react)
├── src/
│   ├── main.tsx                         Bolt          BrowserRouter > AuthProvider > ErrorBoundary > App
│   ├── App.tsx                          Bolt          routes (section 2)
│   ├── index.css                        Bolt          Tailwind directives + base body styles
│   ├── types/
│   │   └── campaign.ts                  Claude Code   ← F-ai/types.ts (byte copy). Bolt imports only.
│   ├── lib/
│   │   ├── supabase.ts                  Bolt (from snippet)  ← src-snippets/src__lib__supabase.ts
│   │   ├── api.ts                       Bolt (from snippet)  ← src-snippets/src__lib__api.ts
│   │   ├── brief.ts                     Bolt (from snippet)  ← src-snippets/src__lib__brief.ts
│   │   ├── campaigns.ts                 Bolt (from snippet)  ← src-snippets/src__lib__campaigns.ts
│   │   └── validation.ts                Claude Code   ← src-snippets/src__lib__validation.ts. Bolt imports only.
│   ├── hooks/
│   │   ├── useAuth.tsx                  Bolt (from snippet)  ← src-snippets/src__hooks__useAuth.tsx
│   │   └── useCampaign.tsx              Bolt (from snippet)  ← src-snippets/src__hooks__useCampaign.tsx
│   ├── components/
│   │   ├── ErrorBoundary.tsx            Bolt (from snippet)  ← src-snippets/src__components__ErrorBoundary.tsx
│   │   ├── ui/                          Bolt          Button, Input, Textarea, Select, Card, Badge, Modal, Toast, Spinner, EmptyState, ErrorState, ProgressDots
│   │   ├── layout/                      Bolt          AppShell (top bar + content), WorkspaceNav (12 sections), PageHeader
│   │   ├── brief/                       Bolt          SmartStart, QuestionStep, BriefReview, GenerationProgress
│   │   ├── workspace/                   Bolt          one component per section (OverviewSection … AssumptionsSection), SectionEditor, FlagsNotice
│   │   ├── calendar/                    Bolt          CalendarTable, CalendarItemDrawer (edit form), CalendarFilters (Should-have)
│   │   └── revision/                    Bolt          ReviseBar (instruction + locks), ProposalDiff (Apply/Discard)
│   └── pages/                           Bolt          Landing, SignIn, SignUp, Dashboard, NewCampaign (smart start + questions + review), Campaign (workspace), Settings, NotFound
└── supabase/
    ├── config.toml                      CLI generated
    ├── migrations/20260926000000_campai_init.sql   Claude Code   ← E-supabase/migration.sql
    ├── seed.sql                         Claude Code   ← E-supabase/seed.sql
    └── functions/
        ├── .env                         git-ignored local secrets
        ├── _shared/
        │   ├── types.ts                 Claude Code   ← F-ai/types.ts (byte copy)
        │   ├── campaign.schema.json     Claude Code   ← F-ai/campaign.schema.json (byte copy)
        │   ├── brief-check.schema.json  Claude Code   ← F-ai/brief-check.schema.json (byte copy)
        │   ├── validation.ts            Claude Code   ← src-snippets/supabase__functions___shared__validation.ts
        │   ├── normalise.ts             Claude Code   ← src-snippets/supabase__functions___shared__normalise.ts
        │   ├── prompts.ts               Claude Code   ← src-snippets/supabase__functions___shared__prompts.ts
        │   ├── openai.ts                Claude Code   ← src-snippets/supabase__functions___shared__openai.ts
        │   └── handler.ts               Claude Code   ← src-snippets/supabase__functions___shared__handler.ts
        └── campaign-ai/
            └── index.ts                 Claude Code   ← edge-function-withsupabase/index.ts (or edge-function-legacy/index.ts after a T4 switch)
```

Snippet naming: `src__lib__api.ts` means `src/lib/api.ts`; `supabase__functions___shared__handler.ts` means `supabase/functions/_shared/handler.ts` (a triple underscore marks the `_shared` folder's leading underscore).

**Ownership rule of thumb:** Bolt = `src/` UI. Claude Code = everything under `supabase/`, the contract copies (`src/types/campaign.ts`, `src/lib/validation.ts`), `CLAUDE.md`/`AGENTS.md`, docs, and fixes in `src/` only while Bolt is idle.

## 2. Routes (React Router)

| Path | Page | Guard | Notes |
|---|---|---|---|
| `/` | Landing | public | Sign in / Get started |
| `/sign-in`, `/sign-up` | Auth | public (redirects to `/app` if signed in) | email + password |
| `/app` | Dashboard | `RequireAuth` | list, empty state, New campaign, delete |
| `/app/new` | NewCampaign | `RequireAuth` | creates a `campaigns` row on first save of the brief; steps: smart start → questions → review → generating |
| `/app/campaigns/:id` | Campaign workspace | `RequireAuth` | `CampaignProvider`; `?section=overview|audience|…` selects the tab; `?tab=calendar` is the editable calendar |
| `/app/settings` | Settings | `RequireAuth` | email, sign out, AI usage summary |
| `*` | NotFound | public | link back |

Generation state lives on `/app/campaigns/:id` too: if `campaign.status === 'draft'` and a brief exists, the page shows the review + **Build my campaign**; while `generating`, the staged progress; on `ready`, the workspace; on `error`, the error state with Retry (same `request_id` reused).

## 3. How the pieces fit (data flow)

1. **Auth** — `useAuth.tsx` wraps `supabase.auth`. `RequireAuth` guards routes. Sign-up creates `auth.users` → trigger creates `profiles`.
2. **Brief** — `brief.ts` holds the nine questions, defaults and validation. `NewCampaign` calls `createCampaign()` on the first save, then `briefCheck()` (Edge Function, `gpt-6-luna`). On success → `draftFromBriefCheck()` → `questionsToAsk(statuses)`; on any failure → `questionsToAsk(null)` (all nine). Review → `upsertBrief()`.
3. **Generate** — `generateCampaign()` → Edge Function reads the saved brief (never the browser's copy), calls OpenAI, validates (`validation.ts`), normalises (`normalise.ts`), saves through `save_plan_version` (SQL) which also rebuilds `calendar_items` and sets the campaign `ready`. Browser reloads.
4. **Workspace** — `useCampaign.tsx` loads campaign + brief + latest plan + calendar rows. Section edits: `saveSection(patch)` → `save_plan_version(...,'edited')`. Calendar edits: `update_calendar_item` / `add_calendar_item` / `delete_calendar_item` (each writes a new plan version). The plan JSON is the source of truth; `calendar_items` rows are its editable projection.
5. **Revise** — `requestRevision(instruction)` with `lockedSections` → Edge Function returns a proposal and inserts `campaign_revisions (status='proposed')`. `ProposalDiff` shows `change_summary` and highlights `changed_sections`. **Apply** → `apply_revision` (SQL, one transaction: new version, rebuild rows, mark applied). **Discard** → status `discarded`.
6. **Usage** — every attempt is one `ai_usage_events` row (admin client). Settings calls `my_ai_usage_summary()`; the ledger table is readable by its owner only.

## 4. TypeScript interfaces

All in `src/types/campaign.ts` (copy of `F-ai/types.ts`): `CampaignPlan` and sub-types; `SECTION_KEYS`, `SECTION_FIELDS`, `SECTION_LABELS`; `BriefCheckResult`, `BRIEF_FIELD_ORDER`; `CampaignBrief`, `BriefCheckRecord`; `AiRequest`/`AiResponse`/`AiError`; row types (`CampaignRow`, `CampaignPlanRow`, `CalendarItemRow`, `CampaignRevisionRow`, `AiUsageEventRow`, `AiModelPricingRow`); `OUTPUT_BOUNDS`. Never redeclare these in components; import them.

## 5. Zod validation

`src/lib/validation.ts` (browser) and `supabase/functions/_shared/validation.ts` (server) are the same file except two import lines. The server validates every OpenAI output before normalising. The browser uses `CampaignPlanSchema.safeParse(planRow.plan)` when loading a campaign: on failure show the error state "This campaign's data looks damaged" with a "Rebuild" button (calls `generate` again) rather than crashing.

## 6. Edge Function: both complete versions

- **Current pattern:** `edge-function-withsupabase/index.ts` — `export default { fetch: withSupabase({ auth: 'user' }, handler) }` from `npm:@supabase/server@^1`. Auth, CORS and both clients come from `ctx`. **Verified against `@supabase/server` 1.8.0:** the user id is `ctx.userClaims.id` (the master prompt's `ctx.userClaims.sub` does not exist; `ctx.jwtClaims.sub` is the raw claim). The package uses `ctx.userClaims?.id ?? ctx.jwtClaims?.sub`.
- **Legacy fallback:** `edge-function-legacy/index.ts` — `Deno.serve`, clients from `npm:@supabase/supabase-js@2`, explicit CORS, `auth.getUser(token)`.
- Both call `handleAiRequest(req, { userId, userClient, adminClient, responseHeaders? })` in `_shared/handler.ts`. **Switching is a one-file paste** plus one line in `CLAUDE.md` section 5.
- Environment names inside the function: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (fallback `SUPABASE_ANON_KEY`), `SUPABASE_SECRET_KEY` (fallback `SUPABASE_SERVICE_ROLE_KEY`) are injected by Supabase; the four campAI secrets come from `supabase secrets set`.

Verification performed on this package (26 Sep 2026): `deno check` and `deno lint` pass for both `index.ts` variants and all `_shared` files against `@supabase/server@1.8.0`, `@supabase/supabase-js@2.117`, `zod@3.25`; `normalise.ts` unit tests pass; the frontend snippets pass `tsc --strict`; the SQL migration applies on Postgres 16 and passes an RLS/CRUD/cascade test; the café example validates against the schema; the TypeScript types are structurally identical to types generated from both schemas.

## 7. Commands (current package managers, 26 September 2026)

```bash
# Frontend (Bolt runs these itself; locally use npm — the scaffold's lockfile is package-lock.json)
npm install
npm run dev                       # http://localhost:5173
npm run build && npm run preview  # production bundle for the leak scan

# Supabase CLI (one teammate's laptop)
supabase login
supabase link --project-ref <ref>
supabase db push                                  # apply migrations
supabase functions new campaign-ai                # only once, creates the folder
supabase functions serve campaign-ai --env-file ./supabase/functions/.env
supabase functions deploy campaign-ai
supabase secrets set --env-file ./supabase/.env.production
supabase secrets list

# Deno checks (optional, needs Deno 2.x locally)
cd supabase/functions && deno check campaign-ai/index.ts && deno lint _shared campaign-ai

# Git (Claude Code, every session)
git pull
git add -A && git commit -m "H5: wire campaign-ai Edge Function" && git push
```

## 8. Installing the package into the repository (Claude Code, first session, change set "I0: scaffold backend")

1. `git pull`. Confirm Bolt is idle.
2. Copy `docs/campai-package/` in full (this package) into the repo if not already there.
3. `cp docs/campai-package/I-code-guide/CLAUDE.md CLAUDE.md && cp CLAUDE.md AGENTS.md`.
4. `cp docs/campai-package/I-code-guide/env.example .env.example`; add the git-ignore lines from section 1.
5. `mkdir -p supabase/migrations supabase/functions/_shared supabase/functions/campaign-ai`.
6. `cp docs/campai-package/E-supabase/migration.sql supabase/migrations/20260926000000_campai_init.sql`; `cp docs/campai-package/E-supabase/seed.sql supabase/seed.sql`.
7. `cp docs/campai-package/F-ai/{types.ts,campaign.schema.json,brief-check.schema.json} supabase/functions/_shared/`.
8. For each `docs/campai-package/I-code-guide/src-snippets/supabase__functions___shared__*.ts`, copy to `supabase/functions/_shared/<name>.ts`.
9. `cp docs/campai-package/I-code-guide/edge-function-withsupabase/index.ts supabase/functions/campaign-ai/index.ts`.
10. `mkdir -p src/types src/lib && cp docs/campai-package/F-ai/types.ts src/types/campaign.ts && cp docs/campai-package/I-code-guide/src-snippets/src__lib__validation.ts src/lib/validation.ts`.
11. `supabase db push`, `supabase secrets set …`, `supabase functions deploy campaign-ai` (E-supabase/setup-steps.md Parts 4–6).
12. Commit: `I0: backend scaffold (migration, seed, edge function, contracts)`. Push. `/clear`.

Bolt then creates the other `src/` files from the snippets in prompts H1–H9 (it may paste them verbatim).

## 9. Where every remaining code block lives

| Block | File | Tool |
|---|---|---|
| Design tokens | `tailwind.config.js` | Bolt (G) |
| Supabase client | `src/lib/supabase.ts` | Bolt (H1) |
| Auth provider + guard | `src/hooks/useAuth.tsx` | Bolt (H2) |
| Nine questions, defaults, brief validation | `src/lib/brief.ts` | Bolt (H3/H4) |
| Edge Function client | `src/lib/api.ts` | Bolt (H5) |
| CRUD + RPC calls | `src/lib/campaigns.ts` | Bolt (H2, H7–H9) |
| Campaign state | `src/hooks/useCampaign.tsx` | Bolt (H6–H9) |
| Error boundary | `src/components/ErrorBoundary.tsx` | Bolt (G) |
| Plan Zod schemas | `src/lib/validation.ts` | Claude Code (I0) |
| Types | `src/types/campaign.ts` | Claude Code (I0) |
| SQL | `supabase/migrations/…`, `supabase/seed.sql` | Claude Code (I0) |
| Edge Function | `supabase/functions/campaign-ai/index.ts` + `_shared/*` | Claude Code (I0) |
