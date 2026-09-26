<!-- AI note: Part G of the campAI implementation package: the single Bolt starting prompt that builds the frontend shell (screens, navigation, tokens, stubbed café flow) with no Supabase and no Edge Function yet.
     Owner: Claude Code (docs) maintains the text; humans paste it into Bolt; Bolt never edits this file. -->

# G-bolt-starting-prompt.md — Part G: Bolt starting prompt (frontend shell only)

Acronyms used in this file: UI = User Interface; UX = User Experience; API = Application Programming Interface; JSON = JavaScript Object Notation; KPI = Key Performance Indicator; CTA = call to action; RLS = Row Level Security.

This prompt builds only what Bolt can build without a backend: every screen, the navigation between them, the design tokens, and the must-have flow running on stubbed café data. Supabase, authentication, the Edge Function, real types and validation arrive later through the Part H follow-up prompts, one change set each. Keeping the first prompt to the shell is deliberate: Bolt drops requirements silently from long prompts, and a shell that renders every screen is the fastest way to find layout and copy problems before real data makes them expensive.

## How to use

1. **Bolt → Project settings → Instructions.** If your Bolt plan offers project-level instructions, paste the block from `I-code-guide/bolt-project-instructions.md` there first. If it does not, paste that block at the top of this prompt.
2. **Start a new Bolt project** with the default Vite + React + TypeScript + Tailwind CSS scaffold. Do not connect Supabase yet.
3. **Paste the prompt below as the very first Bolt message.** Send it whole; do not split it.
4. **When Bolt reports it is finished**, walk through the "Verification checklist" after the prompt. Fix anything missing with a short follow-up message (see "If Bolt drops requirements").
5. **Connect GitHub** (Bolt → GitHub integration) once the shell renders, so every later change is committed. **Do not proceed to Part H until every screen renders and the café stub flows end to end.**

## The prompt

```
You are building the frontend shell of campAI, a "Campaign Operating System" for small-business owners who know their goal ("more customers on weekdays") but not how to turn it into a campaign. The user describes what they want in plain words, answers only the questions we truly need, and gets one complete, editable marketing campaign: audience, positioning, messaging and offer, channels, content ideas, calendar, copy and ad scripts, creative briefs, budget, KPIs (key performance indicators), assumptions and risks.

In this first build there is NO backend. Build every screen and the navigation between them on stubbed data. Do not connect Supabase, call any API (application programming interface), create an Edge Function, or add authentication logic. Those arrive later.

STACK AND DEPENDENCIES (fixed)
- Vite + React 18 + TypeScript + Tailwind CSS (this scaffold).
- Install exactly these packages and nothing else: react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react. Do not import @supabase/supabase-js yet.
- No state-management library (React context and custom hooks only). No component, icon, CSS-in-JS or animation library. If another package seems needed, stop and say so.
- Never put a key in code, never create an environment variable starting with VITE_ (none are needed yet), never reference OpenAI in the frontend.

DESIGN TOKENS
Replace the `theme` in tailwind.config.js with exactly this object, and keep `content: ["./index.html", "./src/**/*.{ts,tsx}"]` and `plugins: []`:

theme: { extend: {
  colors: {
    bg: { DEFAULT: "#0a0a0a", raised: "#111111", sunken: "#050505" },
    surface: { DEFAULT: "#141414", hover: "#1a1a1a", active: "#202020" },
    line: { DEFAULT: "#262626", strong: "#333333", subtle: "#1c1c1c" },
    ink: { DEFAULT: "#f4f4f2", secondary: "#a3a3a3", muted: "#737373", inverse: "#0a0a0a" },
    accent: { DEFAULT: "#c9a86a", hover: "#d8b97c", soft: "rgba(201,168,106,0.12)" },
    state: { success: "#6fbf8a", warning: "#d9a441", danger: "#e06c6c", info: "#7fa7d9" } },
  fontFamily: { sans: ["Inter","ui-sans-serif","system-ui","-apple-system","Segoe UI","Roboto","sans-serif"], mono: ["ui-monospace","SFMono-Regular","Menlo","monospace"] },
  fontSize: {
    display: ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "600" }],
    h1: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
    h2: ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
    h3: ["1.125rem", { lineHeight: "1.3", fontWeight: "600" }],
    body: ["1rem", { lineHeight: "1.6" }], small: ["0.875rem", { lineHeight: "1.5" }],
    caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }] },
  spacing: { 18: "4.5rem", 22: "5.5rem", 30: "7.5rem" },
  borderRadius: { sm: "6px", DEFAULT: "8px", md: "10px", lg: "12px", xl: "16px" },
  boxShadow: { card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)", focus: "0 0 0 2px #0a0a0a, 0 0 0 4px #c9a86a" },
  transitionDuration: { fast: "120ms", base: "180ms", slow: "260ms" },
  maxWidth: { content: "72rem", prose: "42rem" },
  screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1440px" } } }

Visual direction: premium, minimalist, editorial. Background bg, text ink, secondary text ink-secondary, borders line, the accent only on primary buttons, focus rings and active navigation. Large confident headings (display on the landing page, h1 on page titles), generous whitespace, clean grids, subtle rounded corners, calm transitions. No gradients, glass, glow, illustrations or clutter. In src/index.css add the Tailwind directives and set body to bg, ink and font-sans. Token colours only.

TYPES AND STUB DATA
- Create src/types/campaign.ts by pasting the provided file F-ai/types.ts unchanged. Import every type and constant from it (CampaignPlan, CalendarItem, SectionKey, SECTION_KEYS, SECTION_LABELS, BRIEF_FIELD_ORDER, FieldStatus, CampaignStatus). Never redeclare them.
- Create src/data/cafe-example.json by pasting the provided file F-ai/cafe-example.json unchanged: one complete CampaignPlan ("Weekday Regulars: 4 Weeks to Busier Mornings", 12 calendar items, 1500 SGD).
- Create src/lib/stub.ts exporting: getStubPlan(): CampaignPlan; STUB_CAMPAIGNS (one card: id "cafe-demo", the plan title, status "ready", updated_at today); stubBriefCheck(text) resolving after 800 ms with statuses goal, business, budget = "stated"; product_or_service, audience_clues, market, schedule, existing_assets = "inferred"; tone_and_constraints = "missing", plus a one-paragraph restatement and three assumptions; stubGenerate() resolving after 4000 ms with the plan. Everything that will later call a server goes through this file.
- Brief defaults: currency "SGD", market "Singapore", 4 weeks, start = first Monday of next month (date-fns); café placeholder: "I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month."

ROUTES (react-router-dom, BrowserRouter in src/main.tsx wrapped by the ErrorBoundary)
/                    Landing (public)
/sign-in, /sign-up   Auth pages (public; forms only, no logic yet; submitting navigates to /app)
/app                 Dashboard
/app/new             NewCampaign: smart start → follow-up questions → review → generating
/app/campaigns/:id   Campaign workspace; ?section=<key> selects the section, default overview
/app/settings        Settings
*                    NotFound
/app routes stay open for now (a guard comes later). File tree: src/pages (Landing, SignIn, SignUp, Dashboard, NewCampaign, Campaign, Settings, NotFound); src/components/ui (Button, Input, Textarea, Select, Card, Badge, Modal, Toast, Spinner, EmptyState, ErrorState, ProgressDots); src/components/layout (AppShell with top bar and content area, WorkspaceNav, PageHeader); src/components/brief (SmartStart, QuestionStep, BriefReview, GenerationProgress); src/components/workspace (one component per section plus SectionEditor and FlagsNotice); src/components/calendar (CalendarTable, CalendarItemDrawer); src/components/revision (ReviseBar, ProposalDiff); src/components/ErrorBoundary.tsx; src/hooks (empty for now); src/lib (stub.ts).

SCREENS
1. Landing: display headline "Anyone can run a strategically sound campaign", one support sentence, primary button "Get started" (to /sign-up), link "Sign in", three short columns: "Say it in your own words", "Answer only what we need", "Get a complete, editable plan".
2. Sign up / Sign in: centred card, labelled email and password inputs, primary button, link to the other page, an empty inline error area (aria-live="polite").
3. Dashboard (/app): AppShell top bar with the wordmark "campAI" (links to /app), "New campaign" primary button, Settings icon link. Grid of cards from STUB_CAMPAIGNS: title, status Badge (draft, generating, ready, error), "Updated <date>"; click opens /app/campaigns/:id; overflow menu "Rename" and "Delete" (Delete opens a confirm Modal "Delete this campaign? This can't be undone."; both buttons just close). Empty state: heading "No campaigns yet", text "Tell us what you want in your own words and we'll build the plan.", button "Start your first campaign". Add a temporary "Show empty state" toggle in the page header.
4. NewCampaign (/app/new), a four-stage flow held in local state:
   a. Smart start: h1 "Tell us what you want, in your own words", a 5-row Textarea with the café sentence as placeholder, helper "One or two sentences is enough. We'll ask about anything we can't work out.", primary button "Continue" (calls stubBriefCheck, inline Spinner "Reading your brief…"), link "Skip and answer questions instead" (all nine fields become "missing").
   b. Follow-up questions, one per screen, in this fixed order with this exact copy (key | label | helper | three example chips that fill the input when clicked). The placeholder is the first example, except budget "1500" and tone "Friendly and down to earth. Nothing to avoid.":
      goal | What do you want this campaign to achieve? | Say it the way you'd say it to a friend. We'll turn it into a plan. | More customers during weekdays; Sell out our new product launch; Get 50 people to our opening event
      business | What's your business? | A sentence is plenty. | A small café near the business district; An online store selling handmade candles; A mobile dog-grooming service
      product_or_service | What are you promoting? | The product, service or event this campaign is about. | Coffee, drinks and lunch; Our new autumn candle collection; Full grooming packages
      audience_clues | Who are you hoping to attract? | Don't worry about marketing terms. Who buys from you, or who should? | People who work nearby on weekdays; Gift shoppers aged 25 to 45; Dog owners within 10 km
      budget | How much can you spend in total? | Include ads, offers and any content costs. We'll split it for you. | S$1,500; US$800; €2,000 (number input plus three-letter currency Select, default SGD)
      market | Where are your customers? | A city, a neighbourhood, or a country. | Singapore; Tanjong Pagar, Singapore; Australia-wide, online
      schedule | When should it start, and for how long? | We suggest starting on a Monday. Four weeks is a good first campaign. | Next month, 4 weeks; Next Monday, 2 weeks; 1 November, 6 weeks (date input defaulting to the first Monday of next month plus a weeks Select 1–12, default 4)
      existing_assets | What do you already have? | Social accounts, an email list, a website, photos, a shopfront. Anything we can use. | An Instagram account and a small email list; A website and a Facebook page; Nothing yet
      tone_and_constraints | Anything about tone, or anything to avoid? | Optional. For example: friendly and warm; no discounts over 20%; no TikTok. | Friendly and down to earth; Premium and calm; never use exclamation marks; No discounts, we compete on quality
      Show only questions whose status is "inferred" or "missing" (after Skip, all nine). Inferred fields are prefilled and captioned "We assumed this — change it if it's wrong." Show ProgressDots ("Question 2 of 6") and Back / Continue; the last button reads "Review my brief". Required fields block Continue with an inline message ("Please add your goal."); tone is optional.
   c. Brief review: h1 "Here's what we understood", the restatement paragraph, all nine fields as a definition list with Badge "You told us" (stated) or "We assumed" (inferred), an "Edit" link per row jumping back to that question, the assumptions as bullets, primary button "Build my campaign".
   d. Generating: h1 "Building your campaign", a progress bar and an aria-live="polite" status line stepping through, during the 4-second stubGenerate: "Reading your brief", "Choosing who to target", "Shaping the message and the offer", "Picking channels and splitting the budget", "Writing content and the calendar", "Checking numbers and dates". Note: "This usually takes 30 to 90 seconds." Then navigate to /app/campaigns/cafe-demo. Include an error variant (heading "We couldn't build your campaign", the message, buttons Retry and Back to brief) behind a temporary "Simulate error" link.
5. Campaign workspace (/app/campaigns/:id): loads getStubPlan(). PageHeader with the plan title as h1, a status Badge, "Version 1", buttons "Save" (Toast "Saved" for now) and "Back to dashboard". WorkspaceNav: vertical list at lg and above, horizontal scrollable tab strip below, exactly these twelve sections in this order (keys and labels from SECTION_LABELS): overview "Overview", audience "Audience", strategy "Strategy", messaging "Messaging and Offer", channels "Channels", content "Content Ideas", calendar "Calendar", copy "Copy and Ad Scripts", creative_briefs "Creative Briefs", budget "Budget", kpis "KPIs", assumptions "Assumptions and Risks". The active section comes from ?section=. Sections render these plan fields:
   overview: executive_summary, business_objective, timeline (start, end, phases in a row)
   audience: primary and secondary segments as two Cards (all five fields)
   strategy: positioning statement, differentiators, strategic_rationale
   messaging: core_message (large), supporting_messages, the offer (all four fields)
   channels: table of name, role, priority Badge, budget_share_percent, why
   content: content_pillars as Cards with their ideas
   calendar: the editable calendar (below)
   copy: headline_options, social_captions, email_or_message_copy, then ad_scripts (script in a mono block)
   creative_briefs: Cards with all seven fields
   budget: currency and total, line items table with a computed total row
   kpis: table of name, target, how_to_measure, cadence
   assumptions: assumptions, risks with mitigations, next_actions with when and effort.
   Every text section has an "Edit" button that swaps the read view for a SectionEditor form (Textareas for strings, one line per array item) with Save and Cancel, saving to local state. Above the sections render FlagsNotice, a quiet warning strip, with two stub flags ("Budget lines were rescaled to match your total.", "One calendar item was moved inside the campaign dates.").
6. Editable calendar: CalendarTable sorted by date with columns date ("Mon 5 Oct"), week, channel, format, title, status Badge, row action "Edit"; below md each item is a Card. "Add item" button. Edit opens CalendarItemDrawer, a right-side panel (full-screen below md) with labelled fields for every CalendarItem property but id: date, week_number, channel, format, objective, content_pillar, title, hook, body, cta (label it "CTA (call to action)"), creative_direction, ad_script (optional), status Select (planned, in_progress, done, skipped), notes; buttons Save, Cancel, Delete (Delete asks "Remove this calendar item?" in a Modal). Changes are local state. Escape closes the drawer and returns focus to the row's Edit button.
7. Revision bar: ReviseBar pinned to the bottom of the workspace: one-line input with placeholder "Ask for a change, for example: make it suitable for younger customers", a "Revise" button, and a "Lock sections" toggle revealing twelve checkboxes captioned "Locked sections won't change." Submitting shows a 2-second Spinner ("Revising…") then a stubbed proposal: copy the plan, set title to "Weekday Regulars: Coffee for the Under-30 Crowd" and audience.primary.name to "Young professionals nearby", changed_sections ["overview","audience"], change_summary "Retitled the campaign and refocused the primary audience on younger professionals; everything else is unchanged." ProposalDiff renders above the sections: the change_summary, a Badge per changed section, each changed field as current and proposed values side by side (stacked below md), locked sections listed as "Unchanged (locked)", primary "Apply changes" (replaces the local plan, version becomes 2, Toast "Revision applied") and secondary "Discard" (Toast "Revision discarded"). The ReviseBar is disabled while a proposal is open.
8. Settings (/app/settings): placeholder email "demo@campai.app", "Sign out" button (navigates to /), Card "AI usage" with placeholders Calls 0, Tokens 0, Estimated cost US$0.00, Calls today 0 of 25, and an empty "Recent activity" table captioned "No AI calls yet."
9. NotFound: heading "We can't find that page", link "Go to dashboard". Also a generic ErrorState component (heading, message, Retry).

ERROR BOUNDARY
Create src/components/ErrorBoundary.tsx by pasting the provided snippet src-snippets/src__components__ErrorBoundary.tsx unchanged and wrap the app in it in src/main.tsx (BrowserRouter > ErrorBoundary > App).

STATES
Every page has a loading state (Spinner with a short sentence, never a blank page), an empty state wherever a list can be empty, and an error state with Retry. Buttons show a busy, disabled state while a stub runs. Toasts stack bottom-right, disappear after 4 seconds, and use aria-live="polite".

ACCESSIBILITY AND RESPONSIVENESS
Every input has a visible label. Focus is always visible (shadow-focus on :focus-visible). Modals and the drawer trap focus, close on Escape, and return focus to the opener. Navigation uses nav with aria-label; the active section has aria-current="page". Keep text contrast at 4.5:1 or better. Disable transitions under prefers-reduced-motion. Mobile first; the workspace is optimised for laptop and desktop (two columns, 240 px nav at lg and above) and stays usable at 375 px. No horizontal page scrolling at any width.

COPY STYLE
Short, plain, friendly, no marketing jargon. Buttons are verbs. Sentence case. Expand acronyms once per screen ("KPIs (key performance indicators)").

DONE WHEN
- All routes render without console errors or warnings, including an unknown path.
- Dashboard shows the café card and, with the toggle, the empty state.
- The café stub flows end to end: smart start → six follow-up questions (goal, business, budget skipped) → review with "You told us" and "We assumed" badges → 4-second staged generation → workspace overview.
- All twelve sections render real content from cafe-example.json; each Edit form saves locally.
- The calendar lists 12 items by date; the drawer edits, adds and deletes locally.
- Revise shows the stubbed proposal; Apply changes title and version; Discard restores.
- Settings shows the placeholder usage card.
- Keyboard only: the whole café flow, the drawer and the modals work with visible focus.
- Nothing overflows horizontally at 375, 768 or 1280 px.
- package.json lists only the five allowed packages beyond the scaffold; no VITE_ variables exist.
```

## Verification checklist (human, after Bolt finishes)

Do these in the Bolt preview, in order. Open the browser console (F12) and keep it visible.

1. **Routes.** Visit `/`, `/sign-in`, `/sign-up`, `/app`, `/app/new`, `/app/campaigns/cafe-demo`, `/app/settings`, and `/nothing-here`. Each renders; the last shows the not-found page. The console shows no red errors and no React warnings.
2. **Dependencies.** Open `package.json`. Beyond the scaffold's own entries, only `react-router-dom`, `@supabase/supabase-js`, `zod`, `date-fns` and `lucide-react` appear. If anything else is present, apply Troubleshooting T13 (revert and restate the list).
3. **Tokens.** Open `tailwind.config.js` and compare it with `I-code-guide/src-snippets/tailwind.config.js`. The `theme` must match token for token. Confirm the page background is `#0a0a0a` and the accent is the muted gold, used only on primary buttons, focus rings and the active navigation item.
4. **Contract files.** `src/types/campaign.ts` is identical to `F-ai/types.ts`; `src/data/cafe-example.json` is identical to `F-ai/cafe-example.json`. Bolt must not have "tidied" either file.
5. **Café flow.** From the dashboard select New campaign. The empty smart-start box shows the café sentence as its placeholder; type that sentence and Continue. You should see exactly six questions (product or service, audience, market, schedule, existing assets, tone); the first five are prefilled and carry the "We assumed this" caption, tone is blank and optional. Review shows nine rows with badges. Build my campaign runs about four seconds with six changing status lines, then lands on the overview.
6. **Workspace.** Click every one of the twelve navigation items. Each shows content from the café plan, not placeholders. Edit any text section, change a word, Save; the change stays while you switch sections.
7. **Calendar.** Twelve items, sorted by date, first on Monday 5 October 2026. Edit one, change its title, Save. Add an item. Delete an item through the confirm dialog.
8. **Revision.** Type any instruction, Revise. After two seconds the proposal appears with two changed sections and locked sections listed as unchanged. Apply changes: the title changes and the version reads 2. Reload the page, Revise again, Discard: nothing changes.
9. **Keyboard.** Unplug the mouse mentally: Tab through the whole café flow, open the drawer with Enter, close it with Escape, and confirm focus returns to the Edit button. Focus rings must be visible on the dark background.
10. **Responsive.** Use the browser's device toolbar at 375 px, 768 px and 1280 px. The workspace navigation becomes a scrollable tab strip below 1024 px; calendar rows become cards below 768 px; nothing scrolls horizontally.
11. **Secrets.** There is no `.env` file with `VITE_` entries and no string containing `sk-` or `sb_secret_` anywhere in `src/`.
12. **Commit.** Connect GitHub if not done and confirm Bolt's first commit appears in the repository.

## If Bolt drops requirements

Bolt sometimes builds most of a long prompt and silently skips a section. Do not re-send the whole prompt. Instead:

1. Identify the smallest missing piece from the checklist above (for example "the calendar drawer has no Delete button" or "sections 9 to 12 render placeholder text").
2. Copy only that section of the prompt (the numbered screen item or the paragraph) into a new Bolt message, prefixed with one line: "Add the following to the existing shell; do not change anything else."
3. Send one missing section per message and verify each before sending the next. This keeps every Bolt message small, which is also how the Part H prompts are designed.
4. If Bolt introduced a library that is not on the pinned list, ask it to remove that package and re-implement the piece with Tailwind and lucide-react only (Troubleshooting T13).
5. If two attempts to fix the same piece fail, stop and record the issue in the bug log (Part K) for Claude Code to fix while Bolt is idle.
