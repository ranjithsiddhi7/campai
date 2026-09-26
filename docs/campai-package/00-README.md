<!-- AI note: Index and entry point of the campAI implementation package: what each file is, how to use the package, what was verified, known deviations, and the consolidated definition of done.
     Owner: Claude Code (docs). Bolt never edits it. Any AI tool brought into the build reads this first, then CLAUDE.md. -->

# 00-README.md — campAI implementation package

Built from `campAI-master-prompt-v2.md` (approved 26 September 2026). The master prompt is the source of truth; this package is its executable form. If anything here conflicts with the master prompt, the master prompt wins unless the human overrides it in the current conversation, and the conflict should be reported (see "Deviations" below for the two that were necessary).

Acronyms used in this file: AI = Artificial Intelligence; RLS = Row Level Security; SQL = Structured Query Language; JSON = JavaScript Object Notation; API = Application Programming Interface; PDF = Portable Document Format; UI = User Interface; UX = User Experience; PRD = Product Requirements Document; CLI = Command-Line Interface; KPI = Key Performance Indicator; UUID = Universally Unique Identifier; CRUD = Create, Read, Update, Delete.

## 1. What campAI is, in one paragraph

campAI is a Campaign Operating System for small-business owners. The owner types what they want in plain words ("I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month."), answers only the questions the app truly needs, and gets one complete, editable, credible marketing campaign: audience, positioning, messaging and offer, channels, content ideas, calendar, copy and ad scripts, creative briefs, budget, KPIs, assumptions and risks. It is built in a three-day hackathon with Bolt (frontend), Supabase (auth, Postgres with RLS, one Edge Function), the OpenAI Responses API with strict Structured Outputs (exactly three operations: `brief_check`, `generate`, `revise`), and GitHub. **One useful campaign beats ten unfinished features.**

## 2. Package map

| Path | What it is | Who edits it |
|---|---|---|
| `00-README.md` | This index, how to use, verification record, definition of done | Claude Code |
| `A-product-definition.md` | Part A: one-liner, user, pains, 5 Whys, problem statement, success metric, must-have flow, MoSCoW, assumptions | Claude Code |
| `B-prd.md` | Part B: goals, users, user stories, functional and non-functional requirements, scope, acceptance criteria, risks | Claude Code |
| `C-ux-spec.md` | Part C: every screen, the nine-question sequence, workspace, revision Apply/Discard, final copy, **design tokens** | Claude Code (Bolt implements) |
| `D-architecture.md` | Part D: diagram, responsibilities, data model, flows, security boundaries, environment variables, cost control | Claude Code |
| `E-supabase/migration.sql` | Complete executable migration: 8 tables, constraints, indexes, triggers, 10 helper functions, RLS policies, grants, pricing seed | Claude Code |
| `E-supabase/seed.sql` | Pricing rows, one saved café campaign for the demo user, sample ledger rows (idempotent) | Claude Code |
| `E-supabase/setup-steps.md` | Supabase project, auth settings, CLI, secrets, Edge Function deploy, seed, local and deployed testing, in execution order | Claude Code |
| `F-ai/campaign.schema.json` | **Canonical** strict-mode output contract for the campaign plan | Claude Code only |
| `F-ai/brief-check.schema.json` | **Canonical** strict-mode contract for `brief_check` | Claude Code only |
| `F-ai/types.ts` | **Canonical** TypeScript types matching both schemas, section map, request/response contract, row types, output bounds | Claude Code only |
| `F-ai/prompts.md` | The three system prompts and input templates, validation/normalisation/retry rules, error mapping, usage tracking | Claude Code only |
| `F-ai/cafe-example.json` | Complete café plan that validates against `campaign.schema.json`; also the frontend stub and the seed plan | Claude Code only |
| `G-bolt-starting-prompt.md` | Part G: the single 2,490-word Bolt starting prompt (frontend shell only) | Claude Code (humans paste into Bolt) |
| `H-bolt-followup-prompts.md` | Part H: 13 follow-up prompts (H1–H13), one change set each, with verification steps | Claude Code (humans paste into Bolt) |
| `I-code-guide/index.md` | Part I: project tree, ownership, routes, data flow, commands, install steps, where every code block lives | Claude Code |
| `I-code-guide/CLAUDE.md` | Complete project memory for Claude Code: session reminder, rules, runbook, pattern in use | Claude Code |
| `I-code-guide/AGENTS.md` | Byte-identical copy of `CLAUDE.md` for other coding tools | Claude Code |
| `I-code-guide/bolt-project-instructions.md` | Short rules block for Bolt's project instructions | Claude Code |
| `I-code-guide/TROUBLESHOOTING.md` | Runbook T1–T16 with fixes and verification, plus T17–T22 found while building this package | Claude Code |
| `I-code-guide/edge-function-withsupabase/index.ts` | Edge Function entry, current `withSupabase` pattern | Claude Code |
| `I-code-guide/edge-function-legacy/index.ts` | Edge Function entry, legacy `Deno.serve` fallback (paste-to-switch) | Claude Code |
| `I-code-guide/src-snippets/supabase__functions___shared__*.ts` | Shared Edge Function modules: `validation`, `normalise`, `prompts`, `openai`, `handler` | Claude Code |
| `I-code-guide/src-snippets/src__*` | Frontend files Bolt pastes verbatim: `supabase.ts`, `api.ts`, `brief.ts`, `campaigns.ts`, `validation.ts`, `useAuth.tsx`, `useCampaign.tsx`, `ErrorBoundary.tsx` | Bolt creates; either tool fixes |
| `I-code-guide/src-snippets/tailwind.config.js` | Design tokens as a Tailwind theme | Bolt |
| `I-code-guide/env.example` | Environment variable template, no secrets | Claude Code |
| `J-three-day-plan.md` | Part J: 35 blocks over three days with tool, model tier, verification, stop conditions, usage weights, cut list, gates | Claude Code (team edits times) |
| `K-testing.md` | Part K: 13 test groups K1–K13, bug-log template, "twice in a row" rule, café run record | Claude Code (testers fill results) |
| `L-deployment-and-submission.md` | Part L: GitHub, Supabase production, secrets, deploys, smoke test, demo data, Loom and live scripts, deck alignment, submission checklist | Claude Code |
| `campAI-implementation-package.md` | All of the above concatenated in order, for reading and PDF export | Generated; do not edit by hand |

Snippet file names encode their destination: `src__lib__api.ts` → `src/lib/api.ts`; `supabase__functions___shared__handler.ts` → `supabase/functions/_shared/handler.ts`.

The one file without an AI note is `F-ai/cafe-example.json`: the schema forbids extra keys (`additionalProperties: false`), so a note inside it would make it invalid. Its note is here: *canonical café example plan; owner Claude Code only; must always validate against `campaign.schema.json`.*

## 3. How to use this package

**Day 0 (before the hackathon clock starts), 60–90 minutes:**

1. **GitHub:** create the repository; commit this folder as `docs/campai-package/`.
2. **Terminal / Claude Code:** run change set **I0** from `I-code-guide/index.md` section 8 (copies `CLAUDE.md`, `AGENTS.md`, `.env.example`, the migration, the seed, the Edge Function and the contract copies into place).
3. **Supabase Dashboard + CLI:** follow `E-supabase/setup-steps.md` Parts 1–7 (project, auth settings, link, `db push`, secrets, deploy, seed).
4. **Bolt:** paste `I-code-guide/bolt-project-instructions.md` into the project instructions, then the prompt from `G-bolt-starting-prompt.md`.
5. Then follow `J-three-day-plan.md` block by block; Bolt prompts come from `H-bolt-followup-prompts.md`; tests from `K-testing.md`; deployment and submission from `L-deployment-and-submission.md`.

**Roles:** one person drives Bolt (frontend, `src/`), one drives Claude Code (backend, `supabase/`, docs, debugging), a third (optional) tests and prepares the demo. The two tools never edit the same file at the same time.

**For any AI tool brought in mid-build:** read `I-code-guide/CLAUDE.md` first (it contains the master prompt's "Instructions for any AI assistant" and the runbook), then the part relevant to the task. Do not paste the whole master prompt into Bolt; use Parts G and H.

**Generation order used (to keep types from drifting):** `F-ai/` contracts → `E-supabase/` → `I-code-guide/` → remaining parts → the combined document by concatenation.

## 4. Verification record (26 September 2026)

Everything below was executed, not just reviewed:

| Check | Method | Result |
|---|---|---|
| `campaign.schema.json` and `brief-check.schema.json` compile; strict-mode rules hold | Ajv 8 in strict mode; a walker asserting `additionalProperties: false` and every property in `required` at every object (32 objects) | Pass, 0 problems |
| `cafe-example.json` validates against `campaign.schema.json` | Ajv | Pass; budget lines sum to 1,500; channel shares sum to 100; 12 calendar items all inside 2026-10-05 → 2026-11-01; every item's pillar and channel match a defined one |
| `types.ts` matches both schemas | Generated types from both schemas (`json-schema-to-typescript`), asserted mutual assignability and identical key sets under `tsc --strict`; café example assignable to `CampaignPlan` | Pass |
| `migration.sql` parses and applies | `pglast` parse (87 statements); applied on a real Postgres 16 with a mocked `auth` schema and Supabase roles | Pass |
| Migration behaviour | Two users; RLS isolation (user B sees 0 rows, cannot update, `save_plan_version` raises not found); profile trigger; `save_plan_version` rebuilds 12 calendar rows and sets `ready`; `update_calendar_item`, `add_calendar_item`, `delete_calendar_item`, `apply_revision`, `my_ai_usage_summary`; `anon` denied; ledger writable by service role only; pricing not writable by users; campaign delete cascades and keeps the ledger row | Pass (two bugs found and fixed during this test: T18, T19) |
| `seed.sql` | Run twice against the test database with a demo user | Creates the café campaign (version 1, 12 items, 2 ledger rows); second run skips |
| Edge Function, both patterns | `deno check` and `deno lint` on `edge-function-withsupabase/index.ts`, `edge-function-legacy/index.ts` and all `_shared` modules with the real packages resolved (`@supabase/server` 1.8.0, `@supabase/supabase-js` 2.117, `zod` 3.25) | Pass (one finding: T20, see Deviations) |
| Normalisation logic | Deno unit tests: clean plan → no flags and UUID ids; budget/share rescale, date clamp, pillar fix, 24→20 trim; locked-section restore and section diff; first-Monday helper | 4/4 pass |
| Frontend snippets | Assembled as `src/` in a Vite-style project with the pinned dependencies; `tsc --strict --noUnusedLocals` | Pass |
| Live OpenAI and Supabase calls | Not executed (no keys in this environment) | To be done in Day 1 blocks per `J-three-day-plan.md`; expected first-run issues are covered by T6–T10 |

## 5. Deviations from the master prompt (reported, not silent)

1. **`ctx.userClaims.sub` does not exist.** The master prompt's pinned handler text reads `ctx.userClaims.sub`. Verified against `@supabase/server` 1.8.0: the normalised claims object exposes `id` (plus `role`, `email`, `appMetadata`, `userMetadata`); the raw JWT subject is `ctx.jwtClaims.sub`. The shipped `index.ts` uses `ctx.userClaims?.id ?? ctx.jwtClaims?.sub`. Intent unchanged (the verified user's id); wording corrected. Recorded in `CLAUDE.md` §5, `TROUBLESHOOTING.md` T20, `D-architecture.md`. **Human action:** approve, or tell us to change the master prompt's line to match.
2. **`cafe-example.json` has no AI note** (explained in section 2).
3. **Lengths.** Parts C, J and K exceed the informal length targets because the required per-screen, per-block and per-test structure is complete rather than sampled. Nothing is padded; each can be trimmed later by the team if wanted.

No pinned decision was changed: models and Responses API, publishable/secret keys, `withSupabase` first with the 45-minute legacy fallback, three operations behind one Edge Function, the eight tables, the five frontend dependencies, and the Bolt/Claude Code ownership split are all exactly as pinned.

## 6. Consolidated definition of done

Tick every line before submitting. Evidence column says where proof lives.

**Product (must-have flow)**

- [ ] Sign up (instant, no email confirmation) and sign in work on the deployed site; a `profiles` row exists for each user. (K2)
- [ ] Smart start: the café sentence yields ≤ 6 follow-up questions, prefilled, with "We assumed this" markers; the brief review shows stated vs assumed. (K1)
- [ ] Fallback: if `brief_check` fails or times out, the nine fixed questions appear with no error shown. (K12, T15)
- [ ] Build my campaign completes in ≤ 90 s (target 45 s) on `gpt-6-sol` and saves plan version 1 with 6–20 calendar rows. (K1, K13)
- [ ] Workspace shows all 12 sections in order: Overview, Audience, Strategy, Messaging and Offer, Channels, Content Ideas, Calendar, Copy and Ad Scripts, Creative Briefs, Budget, KPIs, Assumptions and Risks. (K1)
- [ ] Budget lines sum to the brief's total; all dates inside the campaign period; any adjustment is shown in the flags notice. (K6)
- [ ] Section edits and calendar item add/edit/delete save a new plan version each time (no AI). (K4, K7)
- [ ] Revision: instruction → proposal with `change_summary` and changed sections → Apply (new version) or Discard (nothing changes); locked sections never change. (K7)
- [ ] Save, reopen from the dashboard, rename, delete (cascade) all work. (K4)
- [ ] Settings shows the AI usage summary (calls, tokens, estimated cost, calls today vs 25). (K1, H10)
- [ ] Every screen has loading, empty and error states with Retry; not-found page exists. (K12)
- [ ] **The café scenario passes twice consecutively** with both runs' latency and cost recorded. (K13 record)

**Security and cost**

- [ ] A second account cannot list, read, modify or delete the first account's campaigns, plans, items or revisions, verified through the REST API and the Edge Function (404), not only the UI. (K3)
- [ ] `ai_usage_events` has one row per attempt including failures; users can read only their own; only the service role writes it; pricing rows are dated 2026-09-26. (K8)
- [ ] Per-user daily cap returns 429 with a clear message at `AI_DAILY_LIMIT_PER_USER` (25). (K8)
- [ ] Duplicate `request_id` returns the earlier result (`X-Campai-Replayed: true`) or 409; a double click bills once. (K8)
- [ ] Estimated cost per full campaign ≤ US$0.20 on `gpt-6-sol` (expected ≈ US$0.08). (K13)
- [ ] Schema validation passes first time in ≥ 9 of 10 generations. (K5)
- [ ] Leaked-key scan of the deployed bundle finds zero `sb_secret_`, `service_role`, `sk-` matches; the browser has only `VITE_SUPABASE_URL` and the publishable key. (K9)
- [ ] Secrets set only in Supabase Edge Function secrets; `.env` files git-ignored; no key in any commit or chat. (L3)

**Engineering hygiene**

- [ ] `CLAUDE.md` and `AGENTS.md` at the repository root, identical, with the Edge Function pattern in use recorded. (I0)
- [ ] Contract copies (`src/types/campaign.ts`, `supabase/functions/_shared/types.ts`, both schema copies) byte-identical to `F-ai/`. (I0)
- [ ] `package.json` dependencies are exactly the pinned five (plus the scaffold's dev tooling). (T13)
- [ ] Bug log kept in the K-testing template; no open S1 bugs at submission.
- [ ] Code freeze respected: no code changes after the freeze time except a rollback. (J Day 3, L11)

**Submission (portal only)**

- [ ] Live product link (`*.bolt.host`) opens, sign-in works, demo account has the café campaign seeded. (L6, L7)
- [ ] 2–3 minute Loom walkthrough recorded per the L8 script.
- [ ] Pitch deck on the provided template, aligned with the 10 slides (L10); slide 8's built list matches what shipped.
- [ ] Team details entered; submission confirmed through the portal with a screenshot; done ≥ 2 hours before the deadline. (L11)

## 7. Regenerating the combined document

`campAI-implementation-package.md` is produced by concatenation, never by rewriting. After editing any source file, run this from `docs/campai-package/` (Python 3, no dependencies). It demotes Markdown headings by one level outside fenced code blocks, and wraps code and data files in fenced blocks unchanged.

```python
import os, re
order = ["00-README.md","A-product-definition.md","B-prd.md","C-ux-spec.md","D-architecture.md",
 "E-supabase/migration.sql","E-supabase/seed.sql","E-supabase/setup-steps.md",
 "F-ai/campaign.schema.json","F-ai/brief-check.schema.json","F-ai/types.ts","F-ai/prompts.md","F-ai/cafe-example.json",
 "G-bolt-starting-prompt.md","H-bolt-followup-prompts.md",
 "I-code-guide/index.md","I-code-guide/CLAUDE.md","I-code-guide/AGENTS.md","I-code-guide/bolt-project-instructions.md","I-code-guide/TROUBLESHOOTING.md",
 "I-code-guide/edge-function-withsupabase/index.ts","I-code-guide/edge-function-legacy/index.ts"] \
 + sorted("I-code-guide/src-snippets/"+f for f in os.listdir("I-code-guide/src-snippets")) \
 + ["I-code-guide/env.example","J-three-day-plan.md","K-testing.md","L-deployment-and-submission.md"]
lang = {".sql":"sql",".json":"json",".ts":"ts",".tsx":"tsx",".js":"js",".example":"bash"}
out = ["<!-- AI note: Combined campAI implementation package, generated by concatenating the package files in order (do not edit by hand; edit the source files and regenerate with the script in 00-README.md section 7).\n     Owner: Claude Code regenerates it; Bolt never edits it. -->\n",
       "# campAI implementation package — combined document\n",
       "Generated 26 September 2026 from `campAI-master-prompt-v2.md`. Sections appear in the package order. Code and data files are shown verbatim inside fenced blocks; the copy-paste source of truth is the individual file.\n",
       "## Contents\n"] + [f"{i+1}. `{p}`" for i, p in enumerate(order)] + ["\n"]
fence_re = re.compile(r"^(```+|~~~+)")
for p in order:
    ext = os.path.splitext(p)[1]
    body = open(p, encoding="utf-8").read().rstrip("\n")
    out += ["\n\n---\n\n", f"<!-- ===== FILE: {p} ===== -->\n"]
    if ext == ".md":
        lines, fence = [], None
        for ln in body.split("\n"):
            m = fence_re.match(ln)
            if m:
                tok = m.group(1)
                if fence is None: fence = tok
                elif ln.strip().startswith(fence[0]) and len(ln.strip().rstrip(fence[0])) == 0 and len(ln.strip()) >= len(fence): fence = None
                lines.append(ln); continue
            lines.append("#" + ln if fence is None and ln.startswith("#") else ln)
        out.append("\n".join(lines))
    else:
        f = "````" if "```" in body else "```"
        out.append(f"## `{p}`\n\n{f}{lang.get(ext, '')}\n{body}\n{f}")
open("campAI-implementation-package.md", "w", encoding="utf-8").write("\n".join(out) + "\n")
```

Save it as a temporary file (for example `/tmp/build-combined.py`) and run `python3 /tmp/build-combined.py`. For a PDF, open the combined Markdown in any Markdown-to-PDF tool (VS Code "Markdown PDF", Typora, or `pandoc campAI-implementation-package.md -o campAI-implementation-package.pdf`).
