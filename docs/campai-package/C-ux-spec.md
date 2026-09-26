<!-- AI note: Part C of the campAI implementation package: the experience specification for every screen, the design tokens, the guided-question sequence, the revision Apply/Discard interaction, the final interface copy and the accessibility checklist.
     Owner: Claude Code (docs) writes it; Bolt implements it and never edits it; humans read it. -->

# C-ux-spec.md — Part C: Experience specification and design tokens

Acronyms used in this part: UX = User Experience; UI = User Interface; AI = Artificial Intelligence; KPI = Key Performance Indicator; CTA = call to action; WCAG = Web Content Accessibility Guidelines; ISO = International Organization for Standardization; UTC = Coordinated Universal Time; SGD = Singapore dollars; JSON = JavaScript Object Notation; UUID = Universally Unique Identifier; CSV = Comma-Separated Values; PDF = Portable Document Format.

This part describes what the user sees and does. It does not restate data shapes or code. The shapes live in `F-ai/types.ts` and `F-ai/campaign.schema.json`; the question copy lives in `I-code-guide/src-snippets/src__lib__brief.ts`; the tokens live in `I-code-guide/src-snippets/tailwind.config.js`; routes and component folders live in `I-code-guide/index.md`. Where this document and those files disagree, the files win and this document must be corrected.

---

## 1. Design principles and the journey

### 1.1 The ten UX principles, as they appear in the interface

| # | Principle (master prompt) | How it shows up on screen |
|---|---|---|
| 1 | Ask, do not teach | Every question is in everyday words ("Who are you hoping to attract?"), never "Define your target segment". Section headings in the workspace use plain nouns. Marketing terms appear only inside generated content, where the plan explains them in the same sentence. |
| 2 | One question at a time | The follow-up flow shows exactly one question per screen, with a progress indicator, Back and Next. No multi-field forms during intake. |
| 3 | Never a blank page | Every input has a placeholder, helper text and three example answers that can be selected with one click. Smart start opens with the café sentence as its example. Dates, duration, currency and market are pre-filled. The dashboard's empty state is an invitation, not a void. |
| 4 | AI does the thinking behind the interface | The user never sees a prompt, a model name during the flow, or a chat window. The three AI operations appear as three buttons: the smart start continue action, **Build my campaign**, and **Propose changes**. |
| 5 | Recommend, do not overwhelm | Each workspace section leads with one strong recommendation (the primary audience, the core message, the offer, the primary channel) and puts supporting detail below it. Lists are short; the schema bounds them. |
| 6 | Progressive disclosure | Workspace sections are separate views, not one long page. Calendar rows open a drawer for detail. The revision proposal shows a summary first and the before/after per section on demand. Usage details in Settings sit below the summary numbers. |
| 7 | Actionable and understandable | Every section ends in something the user can do: a next action, a calendar item, a copy block to paste. KPIs include "how to measure" in plain words without paid tools. |
| 8 | User control through editing | Every text field in the plan is editable through an inline **Edit** toggle. Every calendar item is editable and deletable. Sections can be locked against AI revisions. Nothing the AI proposes is saved until the user applies it. |
| 9 | Show assumptions, hide reasoning | Inferred brief values carry the badge "We assumed this". The plan's Assumptions and Risks section and the "We adjusted a few things" notice show what the app or the model assumed or corrected. No hidden chain of thought is displayed anywhere. |
| 10 | Goal → Guidance → Recommendation → Action | The screens follow this sequence exactly; see the next table. |

### 1.2 The journey mapped to screens

| Stage | What the user does | Screens |
|---|---|---|
| Goal | States what they want in their own words | Landing → Sign-up or Sign-in → Dashboard → Smart start |
| Guidance | Answers only the questions the app still needs; confirms the brief | Follow-up questions → Brief review |
| Recommendation | Waits briefly, then reads one complete plan | Generation/loading → Campaign workspace (12 sections) |
| Action | Edits, revises, saves, reopens, and executes from the calendar | Workspace editing, Editable calendar, Revise with AI, Dashboard (reopen), Settings (cost proof) |

---

## 2. Design tokens

All tokens are defined once in `tailwind.config.js` (snippet at `I-code-guide/src-snippets/tailwind.config.js`) and used through Tailwind class names. **These are the only colours allowed in the product.** Bolt must not add gradients, glass effects, glow, illustrations, background images, or any colour outside this table. Decoration is limited to borders, subtle shadows, and whitespace.

### 2.1 Colour

| Token (Tailwind class stem) | Hex or value | Usage |
|---|---|---|
| `bg` | `#0a0a0a` | Page background (the deck's theme colour). `body` background. |
| `bg-raised` | `#111111` | Top bar, workspace left navigation, drawers and modals. |
| `bg-sunken` | `#050505` | Code-like blocks (copy blocks, the JSON-free "script" panels), table header rows. |
| `surface` | `#141414` | Cards, inputs at rest, table rows. |
| `surface-hover` | `#1a1a1a` | Hover state of interactive cards, rows, menu items. |
| `surface-active` | `#202020` | Pressed state; the selected item in the workspace navigation. |
| `line` | `#262626` | Default borders and dividers. |
| `line-strong` | `#333333` | Input borders on hover, emphasised dividers, table header underline. |
| `line-subtle` | `#1c1c1c` | Hairlines inside cards, row separators. |
| `ink` | `#f4f4f2` | Primary text, headings, primary button label on accent is `ink-inverse` instead. |
| `ink-secondary` | `#a3a3a3` | Secondary text, helper text, labels, table headers. |
| `ink-muted` | `#737373` | Captions, timestamps, placeholders, disabled text. Contrast on `bg` is 4.3:1, so use it only for text ≥ 18.66px bold or ≥ 24px regular, or for non-essential captions. Never for body copy or button labels. |
| `ink-inverse` | `#0a0a0a` | Text on accent-filled surfaces (primary button label). |
| `accent` | `#c9a86a` | The single accent: primary button fill, focus ring, active navigation marker, links, selected example chip border. |
| `accent-hover` | `#d8b97c` | Primary button hover fill, link hover. |
| `accent-soft` | `rgba(201,168,106,0.12)` | Tinted background behind "We assumed this" badges, the selected navigation item, the "We adjusted a few things" notice, changed-section chips. |
| `state-success` | `#6fbf8a` | Success toasts and the `done` calendar status dot (always paired with text). |
| `state-warning` | `#d9a441` | Warnings, the `skipped` status dot, validation flags icon. |
| `state-danger` | `#e06c6c` | Error text, destructive button text and border, inline validation errors, the `error` campaign status. |
| `state-info` | `#7fa7d9` | Informational notices, the `in_progress` status dot. |

Rules: text on `bg`, `bg-raised` and `surface` is always `ink` or `ink-secondary`. State colours are used for icons, dots, borders and short labels, never for paragraphs. The accent is never used as a large background area; the only accent-filled element is the primary button.

### 2.2 Typography

Font family: `Inter`, falling back to `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (Tailwind `font-sans`). Load Inter from Google Fonts in `index.html` with weights 400, 500 and 600; if the font fails to load the system stack renders the same layout. `font-mono` (`ui-monospace, SFMono-Regular, Menlo, monospace`) is used only for the request ID in error details and for token counts in Settings.

| Token (class) | Size | Line height | Letter spacing | Weight | Usage |
|---|---|---|---|---|---|
| `text-display` | 3.5rem (56px) | 1.05 | -0.02em | 600 | Landing headline only. Drops to `text-h1` below `md`. |
| `text-h1` | 2.25rem (36px) | 1.1 | -0.02em | 600 | Page titles: dashboard, campaign title in the workspace, question label on each follow-up step. |
| `text-h2` | 1.5rem (24px) | 1.2 | -0.01em | 600 | Section titles inside the workspace, card group titles, modal titles. |
| `text-h3` | 1.125rem (18px) | 1.3 | — | 600 | Card titles, calendar item title in the drawer, sub-headings inside a section. |
| `text-body` | 1rem (16px) | 1.6 | — | 400 | All body copy, inputs, buttons, table cells. |
| `text-small` | 0.875rem (14px) | 1.5 | — | 400 (500 for labels) | Helper text, form labels, badges, table headers, navigation items. |
| `text-caption` | 0.75rem (12px) | 1.4 | 0.02em | 400 | Timestamps, version numbers, progress text, footnotes. Uppercase with `tracking` only for table headers and "Locked" badges. |

Weight rules: 600 for headings and the primary button, 500 for labels, navigation and secondary buttons, 400 for everything else. Never use 700 or above. Body text measure is capped by `max-w-prose` (42rem) on reading-heavy sections (Overview, Strategy, Assumptions and Risks).

### 2.3 Spacing

Tailwind's default 4px scale (`1` = 4px, `2` = 8px, `4` = 16px, `6` = 24px, `8` = 32px, `12` = 48px, `16` = 64px) plus three custom steps for page rhythm:

| Token | Value | Usage |
|---|---|---|
| `18` | 4.5rem (72px) | Vertical gap between landing sections on `md` and up. |
| `22` | 5.5rem (88px) | Top padding of the landing hero on `lg` and up. |
| `30` | 7.5rem (120px) | Bottom padding of the landing page and the centred intake column's top offset on `xl`. |

Standard choices: page side gutter `px-4` on mobile, `px-6` from `md`, `px-8` from `lg`. Card padding `p-6` (`p-4` below `md`). Gap between cards `gap-6`. Gap between a label and its input `gap-2`. Gap between form fields `gap-6`. Button horizontal padding `px-4` (`px-5` for the primary CTA), vertical `py-2.5`.

### 2.4 Radius, borders and shadows

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 6px | Badges, chips, small controls. |
| `rounded` | 8px | Buttons, inputs, selects, textareas. |
| `rounded-md` | 10px | Table containers, notices. |
| `rounded-lg` | 12px | Cards, drawers. |
| `rounded-xl` | 16px | Modals, the landing hero card. |
| Border width | 1px everywhere (`border`) | No 2px borders except the focus ring (which is a shadow, not a border). |
| `shadow-card` | `0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)` | Cards on `bg`, drawers, modals, the proposal panel. Not on inputs or buttons. |
| `shadow-focus` | `0 0 0 2px #0a0a0a, 0 0 0 4px #c9a86a` | The only focus indicator. Applied with `focus-visible:shadow-focus focus-visible:outline-none` on every interactive element. |

### 2.5 Interaction states

| Element | Default | Hover | Active (pressed) | Focus (keyboard) | Disabled |
|---|---|---|---|---|---|
| Primary button | `bg-accent text-ink-inverse font-semibold rounded` | `bg-accent-hover` | `bg-accent` with `translate-y-px` | `shadow-focus` | `opacity-50 cursor-not-allowed`, no hover change |
| Secondary button | `bg-transparent text-ink border border-line rounded` | `bg-surface-hover border-line-strong` | `bg-surface-active` | `shadow-focus` | `opacity-50 cursor-not-allowed` |
| Destructive button | `bg-transparent text-state-danger border border-line rounded` | `bg-surface-hover border-state-danger` | `bg-surface-active` | `shadow-focus` | `opacity-50` |
| Ghost / icon button | `text-ink-secondary rounded` | `text-ink bg-surface-hover` | `bg-surface-active` | `shadow-focus` | `opacity-50` |
| Link | `text-accent underline-offset-4` | `text-accent-hover underline` | same as hover | `shadow-focus rounded-sm` | — |
| Input, textarea, select | `bg-surface text-ink border border-line rounded placeholder:text-ink-muted` | `border-line-strong` | — | `border-accent shadow-focus` | `bg-bg-raised text-ink-muted cursor-not-allowed` |
| Input with error | `border-state-danger` plus error text in `text-small text-state-danger` below, linked with `aria-describedby` | unchanged | — | `shadow-focus` | — |
| Navigation item | `text-ink-secondary rounded` | `text-ink bg-surface-hover` | — | `shadow-focus` | — |
| Navigation item, selected | `text-ink bg-accent-soft` with a 2px `accent` bar on the left (`lg` and up) or bottom (tab strip) and `aria-current="page"` | unchanged | — | `shadow-focus` | — |
| Example chip | `bg-surface border border-line text-ink-secondary rounded-sm text-small` | `border-line-strong text-ink` | — | `shadow-focus` | — |
| Table row (calendar) | `bg-surface border-b border-line-subtle` | `bg-surface-hover cursor-pointer` | — | `shadow-focus` inset on the row (row is a button) | — |
| Toggle (lock) | `text-ink-muted` unlocked icon | `text-ink` | — | `shadow-focus` | — |
| Toggle (lock), on | `text-accent` locked icon plus visible "Locked" badge, `aria-pressed="true"` | unchanged | — | `shadow-focus` | — |

Focus is shown only on keyboard focus (`focus-visible`), never removed. Every interactive element is at least 40px tall; icon-only buttons are 40px by 40px with an `aria-label`.

### 2.6 Motion

| Token | Value | Usage |
|---|---|---|
| `duration-fast` | 120ms | Colour and border changes on hover and focus. |
| `duration-base` | 180ms | Drawer and modal opacity, toast enter and exit, section switch fade. |
| `duration-slow` | 260ms | Drawer slide-in from the right, proposal panel expand. |
| Easing | `ease-out` for everything | No bounce, no spring. |

Under `@media (prefers-reduced-motion: reduce)` all transitions and the progress bar animation are set to `transition: none` and the spinner is replaced by a static "Working…" text with `aria-live`. No element moves on scroll; no parallax; no auto-playing animation apart from the generation progress bar and spinner.

### 2.7 Breakpoints and layout widths

| Token | Value | Layout at and above it |
|---|---|---|
| `sm` | 640px | Two-column button rows; dashboard cards two per row. |
| `md` | 768px | Landing headline at `text-display`; auth card centred with side margins; calendar table appears (cards below `md`). |
| `lg` | 1024px | Workspace left navigation becomes a fixed 240px column; below `lg` it is a horizontal scrollable tab strip. Dashboard cards three per row. |
| `xl` | 1280px | Workspace content column reaches `max-w-content`; Before/After toggle available in the proposal. |
| `2xl` | 1440px | No layout change; extra space becomes margin. |
| `max-w-content` | 72rem (1152px) | Maximum width of every app page's content area, centred. |
| `max-w-prose` | 42rem (672px) | Maximum width of paragraphs, the intake column, the auth card, and the Settings page. |

---

## 3. Navigation model

### 3.1 Routes

From `I-code-guide/index.md` section 2. Public routes need no session; app routes are wrapped in `RequireAuth` (`src/hooks/useAuth.tsx`) which shows "Loading…" while the session loads and redirects to `/sign-in` (remembering the intended path) when there is none.

| Path | Page component (`src/pages/`) | Access |
|---|---|---|
| `/` | Landing | Public |
| `/sign-in` | SignIn | Public; redirects to `/app` when already signed in |
| `/sign-up` | SignUp | Public; redirects to `/app` when already signed in |
| `/app` | Dashboard | Signed in |
| `/app/new` | NewCampaign (smart start → questions → review → generating) | Signed in |
| `/app/campaigns/:id` | Campaign (workspace; `?section=` selects the section, `?tab=calendar` opens the calendar) | Signed in |
| `/app/settings` | Settings | Signed in |
| `*` | NotFound | Public |

### 3.2 App shell (`src/components/layout/AppShell`)

Present on every `/app` route. A 56px top bar on `bg-raised` with a 1px `line` bottom border containing, left to right:

1. The wordmark **campAI** (text, `text-h3` weight 600, `ink`; the "AI" is not coloured differently). Links to `/app`.
2. Navigation links **Dashboard** (`/app`) and **Settings** (`/app/settings`) in `text-small` 500, with the selected one in `ink` and `aria-current="page"`.
3. Right-aligned: the user's email in `text-small text-ink-secondary`, truncated with an ellipsis at 200px, acting as a menu button (`aria-haspopup="menu"`). The menu has one item, **Sign out**. Below `sm` the email is replaced by a user icon button with `aria-label="Account menu"`.

Below the top bar the page content sits in `max-w-content` with the standard gutters. Public pages (Landing, Sign-in, Sign-up, NotFound) use a lighter header: the wordmark on the left and a single **Sign in** or **Get started** link on the right.

### 3.3 Workspace navigation (`src/components/layout/WorkspaceNav`)

Twelve sections in this exact order and with these exact labels. Keys and labels come from `SECTION_KEYS` and `SECTION_LABELS` in `F-ai/types.ts`; the component must import them rather than retyping them.

| Order | Key | Label |
|---|---|---|
| 1 | `overview` | Overview |
| 2 | `audience` | Audience |
| 3 | `strategy` | Strategy |
| 4 | `messaging` | Messaging and Offer |
| 5 | `channels` | Channels |
| 6 | `content` | Content Ideas |
| 7 | `calendar` | Calendar |
| 8 | `copy` | Copy and Ad Scripts |
| 9 | `creative_briefs` | Creative Briefs |
| 10 | `budget` | Budget |
| 11 | `kpis` | KPIs |
| 12 | `assumptions` | Assumptions and Risks |

At `lg` and above: a 240px left column on `bg-raised`, sticky under the top bar, listing the twelve items vertically. Each item shows its label, a lock toggle icon button on the right (see section 11), and the "Locked" badge when locked. The selected item uses the selected navigation state and a 2px accent bar on its left edge. Selecting an item updates `?section=<key>` (and `?tab=calendar` for Calendar, keeping the route table's convention) without a full reload, moves focus to the section heading, and scrolls the content column to the top.

Below `lg`: the same twelve items as a horizontal scrollable tab strip (`role="tablist"` semantics are not used because each item is a link; plain `nav` with links) directly under the campaign title, `overflow-x-auto`, no visible scrollbar on touch devices, the selected item marked with a 2px accent bottom bar and scrolled into view on load. Lock toggles are hidden in the strip and shown instead inside each section header as a small **Lock section** / **Unlock section** button.

The Revise with AI bar (section 11) sits above the section content on every section, collapsed to one line until the user focuses it.

---

## 4. Screen specifications

Every screen below uses the same sub-headings: Purpose; Components; Actions; Displayed data; Empty, loading and error states; Responsive behaviour; Accessibility. Component names refer to the folders in `I-code-guide/index.md` section 1 (`ui/`, `layout/`, `brief/`, `workspace/`, `calendar/`, `revision/`, `pages/`).

### 4.1 Landing (`pages/Landing`)

**Purpose.** Explain in one screen what campAI does and move the visitor to Sign-up or Sign-in. It is not a marketing site.

**Components.** Public header (wordmark, **Sign in** link). Hero: `text-display` headline, one paragraph in `text-body text-ink-secondary` capped at `max-w-prose`, primary button **Get started**, secondary button **Sign in**. Below the hero, a single row of three `ui/Card` items titled "Say what you want", "Answer only what we need", "Get one complete plan", each with two sentences. A short footer line: "campAI — Campaign Operating System" and a link to `/sign-in`.

Headline copy: "From 'I need more customers' to 'here is exactly what to do'." Paragraph copy: "Tell campAI your goal in your own words. It asks only the questions it still needs, then builds one complete, editable campaign: who to target, what to say, what offer to run, where to run it, what to post and when, how to spend your budget, and how you'll know it worked."

**Actions.** Get started → `/sign-up`. Sign in → `/sign-in`. A signed-in visitor sees **Open dashboard** instead of Get started.

**Displayed data.** None.

**Empty, loading and error states.** None; the page is static.

**Responsive behaviour.** Headline drops to `text-h1` below `md`. Cards stack below `sm`. Hero padding uses the custom `22` and `30` spacing tokens on `lg` and up.

**Accessibility.** One `h1`. Buttons are real links styled as buttons. No decorative images, so no alt text needed. Skip link "Skip to content" as the first focusable element on every page, visible on focus.

### 4.2 Sign-up (`pages/SignUp`)

**Purpose.** Create an account with email and password. Email confirmation is off for the hackathon, so sign-up signs the user in immediately.

**Components.** Public header. A centred `ui/Card` (`max-w-prose`, `rounded-xl`, `shadow-card`) with `h1` "Create your account", `ui/Input` Email (type `email`, `autocomplete="email"`), `ui/Input` Password (type `password`, `autocomplete="new-password"`, helper "At least 6 characters", with a **Show** / **Hide** toggle button), primary `ui/Button` **Create account**, and the line "Already have an account? Sign in" with a link.

**Actions.** Submit calls `signUp` from `useAuth`. On success navigate to `/app` (or the remembered `from` path). On failure show the returned message below the form in a `role="alert"` region and keep the entered email.

**Displayed data.** None.

**Empty, loading and error states.** Loading: the button shows a `ui/Spinner` and the label "Creating account…", inputs disabled. Errors (from `useAuth.tsx`): "There's already an account with this email. Sign in instead."; "Use a password with at least 6 characters."; "Too many attempts. Wait a minute and try again."; "Something went wrong signing you in. Please try again." Client-side: an empty or malformed email shows "Enter a valid email address." and a password shorter than 6 characters shows "Use a password with at least 6 characters." before submitting.

**Responsive behaviour.** Card is full width with `px-4` below `md`, centred with `mt-12` from `md`.

**Accessibility.** Labels are visible, not placeholder-only. Error text is linked with `aria-describedby`. Focus moves to the first invalid field on submit. Show/Hide toggle has `aria-pressed`.

### 4.3 Sign-in (`pages/SignIn`)

**Purpose.** Return an existing user to the dashboard.

**Components.** Same card as Sign-up with `h1` "Sign in", Email, Password (`autocomplete="current-password"`), primary button **Sign in**, and "New to campAI? Create an account" link.

**Actions.** Submit calls `signIn`. Success → `/app` or the remembered path.

**Displayed data.** None.

**Empty, loading and error states.** Loading: button label "Signing in…". Errors: "That email and password don't match. Try again."; "This email hasn't been confirmed yet. Check your inbox." (only if confirmation was turned back on); "Too many attempts. Wait a minute and try again."; "Something went wrong signing you in. Please try again."

**Responsive behaviour and accessibility.** As Sign-up.

### 4.4 Campaign dashboard (`pages/Dashboard`)

**Purpose.** List the user's campaigns, open one, start a new one, delete one.

**Components.** `layout/AppShell`; `layout/PageHeader` with `h1` "Your campaigns" and primary button **New campaign**; a grid of `ui/Card` items, one per campaign; `ui/Modal` for delete confirmation; `ui/Toast` for results.

Each card shows: the campaign title (`text-h3`, one line, ellipsis), a `ui/Badge` for status (Draft, Building, Ready, Needs attention, mapped from `draft`, `generating`, `ready`, `error`), the line "Updated 3 hours ago" (relative, using `date-fns`, with the absolute date in a `title` attribute), and "Version 3" when `current_plan_version` > 0. A ghost icon button (three dots, `aria-label="Campaign actions"`) opens a small menu with **Rename** and **Delete**.

**Actions.** Card click → `/app/campaigns/:id`. New campaign → `/app/new`. Rename → an inline text field replacing the title, Save on Enter or blur, Escape cancels (calls `renameCampaign`; titles are trimmed to 120 characters). Delete → modal "Delete this campaign?" with body "This removes the brief, the plan, all versions and the calendar. This can't be undone." and buttons **Delete campaign** (destructive) and **Cancel**. After delete, toast "Campaign deleted."

**Displayed data.** `CampaignRow` fields `title`, `status`, `updated_at`, `current_plan_version`, ordered by `updated_at` descending (`listCampaigns`).

**Empty, loading and error states.** Loading: three skeleton cards (`surface` blocks with a slow opacity pulse; static under reduced motion) and `aria-busy="true"` on the grid. Empty: see 4.5. Error: `ui/ErrorState` "We couldn't load your campaigns." with a **Retry** button.

**Responsive behaviour.** One card per row below `sm`, two from `sm`, three from `lg`. The header button becomes full width below `sm`.

**Accessibility.** Cards are links with the title as accessible name; the actions button is a separate focusable control so a keyboard user can reach both. Status badge text is readable without colour. Delete modal traps focus, returns focus to the actions button on close.

### 4.5 Empty dashboard state (`ui/EmptyState` inside `pages/Dashboard`)

**Purpose.** Turn the first visit into the first campaign.

**Components.** A centred `ui/Card` (`max-w-prose`) with `h2` "Start your first campaign", paragraph "Tell campAI what you want in a sentence. It asks a few questions, then builds the whole plan: audience, message, offer, channels, calendar, copy, budget and KPIs.", primary button **New campaign**, and the caption "Takes about two minutes. You can change everything afterwards."

**Actions.** New campaign → `/app/new`.

**Displayed data.** None.

**States.** Shown only when the list loaded successfully and is empty.

**Responsive behaviour.** Card padding `p-6` on mobile, `p-12` from `md`.

**Accessibility.** The `h2` follows the page `h1` "Your campaigns", which remains visible.

### 4.6 Smart start (`pages/NewCampaign` step 1, `brief/SmartStart`)

**Purpose.** Let the user say what they want in one free-text box, then run the single `brief_check` call.

**Components.** `layout/AppShell`; a centred column (`max-w-prose`); `h1` "Tell us what you want, in your own words"; helper "One or two sentences is enough. We'll work out the rest and only ask what we still need."; `ui/Textarea` (5 rows, auto-growing to 12, 2,000-character limit with a counter that appears at 1,800) with the placeholder set to `CAFE_EXAMPLE` from `src/lib/brief.ts`; a button **Use this example** that fills the textarea with the same sentence; primary button **Continue**; a text link **Skip and answer step by step** that goes straight to the full nine-question sequence without calling AI.

**Actions.** Continue: if the text is shorter than 10 characters, show "Add a little more so we can help." and stop. Otherwise create the campaign row if it does not exist (`createCampaign`, title "Untitled campaign"), call `briefCheck` with today's date, `DEFAULT_CURRENCY` and `DEFAULT_MARKET`, and move to the follow-up questions. The button shows a spinner and the label "Reading your brief…" while waiting (the call has a 20-second timeout on the server). Skip: move to the questions with all statuses `missing` and `used_ai = false`.

**Displayed data.** None yet.

**Empty, loading and error states.** Loading: textarea and buttons disabled, status text "Reading your brief…" in an `aria-live="polite"` region. Failure of any kind (timeout, error response, invalid fields, network): **no error is shown**; the app moves to the full nine-question sequence with defaults, records `used_ai = false`, and keeps the free text so it appears prefilled in the goal question. This silent fallback is a must-have (master prompt flow step 5 and runbook T15). The only exception is the daily cap (429 `daily_limit_reached`), where a small notice above the first question says "You've reached today's limit of 25 AI actions. It resets at midnight UTC. You can still answer the questions and build tomorrow." and Build my campaign is disabled on the review screen with the same message.

**Responsive behaviour.** Full-width column on mobile with `px-4`; centred with the `30` top offset on `xl`.

**Accessibility.** The textarea has a visible label (the `h1` is linked with `aria-labelledby`) and the helper via `aria-describedby`. The example button describes itself: `aria-label="Use the café example"`. Continue is the default submit action on Ctrl+Enter or Cmd+Enter.

### 4.7 Follow-up questions (`pages/NewCampaign` step 2, `brief/QuestionStep`)

**Purpose.** Ask, one per screen, only the brief fields that are `inferred` or `missing`; or all nine when smart start was skipped or failed.

**Components.** Centred column (`max-w-prose`). `ui/ProgressDots` plus the text "Question 2 of 6" (`text-caption text-ink-secondary`, `aria-live="polite"`). The question label as `h1` (from `questionLabel()`: the model's question when it is available and longer than five characters, otherwise the fixed label). Helper text in `text-small text-ink-secondary`. When the field was `inferred`, a `ui/Badge` in `accent-soft` above the input reading "We assumed this — change it if it's wrong". The input for the question's `kind` (see section 6). A row of three example chips. Buttons: **Back** (secondary, hidden on the first question), **Next** (primary; labelled **Review brief** on the last question), and **Skip** (ghost, only on the optional tone question).

**Actions.** Next validates the current field with `validateDraft` and shows the field's message inline if invalid; otherwise records the field in `answered_fields` and advances. Back returns without validating. Skip advances leaving the tone field empty. Selecting an example chip replaces the input value and moves focus back to the input. Enter in a single-line input triggers Next; in the textarea, Ctrl+Enter or Cmd+Enter does.

**Displayed data.** The draft value for the field (prefilled from `draftFromBriefCheck` or from `emptyDraft`), the field status, and the computed end date on the schedule step.

**Empty, loading and error states.** No loading state; everything is local. Validation messages come from `validateDraft` in `src/lib/brief.ts` and appear under the input in `state-danger`. If the user reloads the page mid-sequence, the draft is lost and the flow restarts at smart start (acceptable for the hackathon; the unsaved-change warning is a Should-have).

**Responsive behaviour.** Buttons stack full width below `sm` with Next on top. The example chips wrap.

**Accessibility.** Focus moves to the `h1` on every step change so screen readers announce the new question. The progress text is announced through `aria-live`. The badge text is real text, not an icon. Every input has a visible label.

### 4.8 Brief review (`pages/NewCampaign` step 3, `brief/BriefReview`)

**Purpose.** Show the whole brief in one place, mark what was stated and what was assumed, and hand over to generation. Specified in detail in section 7.

**Components.** Column at `max-w-content` on `lg` and `max-w-prose` below. `h1` "Here's your brief". When `brief_check` succeeded, its `restatement` paragraph in a `ui/Card` titled "In other words" with the assumptions list below it as bullets under the caption "What we assumed". A table (or stacked list below `md`) of the nine fields with a badge per row and an **Edit** link per row. Primary button **Build my campaign**, secondary **Back**.

**Actions.** Edit jumps to that question step and returns to the review on Next. Build my campaign upserts the brief (`upsertBrief`), navigates to `/app/campaigns/:id`, and starts generation there. Back returns to the last question step.

**Displayed data.** All `CampaignBrief` fields, formatted: budget as amount with thousands separator and currency code ("1,500 SGD"); schedule as "Mon 5 Oct 2026 for 4 weeks (ends Sun 1 Nov 2026)"; tone shown as "None given" in `ink-muted` when empty.

**Empty, loading and error states.** While the brief saves, the button reads "Saving…". If the save fails: inline error "We couldn't save your brief. Check your connection and try again." with the button re-enabled. If the daily cap notice was set earlier, the button is disabled with that message beside it.

**Responsive behaviour.** Table becomes a stacked list of label, value, badge and Edit link below `md`.

**Accessibility.** The table has a caption "Your campaign brief". Badges are text. Each Edit link has an accessible name including the field ("Edit budget").

### 4.9 Campaign generation and loading (`pages/Campaign` while `status === 'generating'`, `brief/GenerationProgress`)

**Purpose.** Hold the user calmly for 30 to 90 seconds with honest progress. Specified in detail in section 8.

**Components.** Centred column (`max-w-prose`). `h1` "Building your campaign". A staged message in `text-h3` inside an `aria-live="polite"` region. A thin indeterminate progress bar (2px, `accent` on `line`) beneath it. The caption "Usually 30 to 90 seconds. You can keep this tab open." Below, a quiet `ui/Card` "What's happening" listing the brief's goal, budget, market and dates so the user can re-read them while waiting.

**Actions.** None. There is no Cancel (section 8 explains why). The browser back button returns to the dashboard; generation continues on the server and the campaign shows as Building there.

**Displayed data.** The saved brief summary.

**States.** On success the page swaps to the workspace at Overview and shows the flags notice if any. On error the page shows `ui/ErrorState` with the returned message and a **Try again** button that reuses the same `request_id` (a replay returns the stored result if the first call actually finished). On timeout the message is "This is taking longer than usual. Please try again."

**Responsive behaviour.** Nothing changes except padding.

**Accessibility.** Progress bar has `role="progressbar"` with `aria-valuetext` equal to the current staged message and no numeric value. Under reduced motion the bar is static and only the text updates.

### 4.10 Campaign workspace (`pages/Campaign` on `status === 'ready'`, `components/workspace/*`)

**Purpose.** Present the complete plan as twelve readable sections, each editable, with the calendar as a working tool and the revision bar always at hand.

**Components.** `layout/AppShell`; `layout/PageHeader` with the campaign title as `h1` (editable in place through a pencil ghost button, same behaviour as dashboard Rename), a `ui/Badge` "Version 3", and the caption "Saved 2 minutes ago"; `revision/ReviseBar`; `workspace/FlagsNotice`; `layout/WorkspaceNav`; the current section component; `workspace/SectionEditor` (the shared plain-form editor); `ui/Toast`.

**Editing model (applies to every section).** Each section is displayed read-only with an **Edit** secondary button in its header. Edit toggles the section into a plain form: every displayed text becomes an `ui/Input` or `ui/Textarea`, each list becomes a list of inputs with **Add** and **Remove** controls (bounded by the schema's maximum counts, which the form states in a caption such as "Up to 5 pillars"), each enumerated value becomes a `ui/Select`, and numbers become numeric inputs. The section header now shows **Save** (primary) and **Cancel** (secondary). Save runs `CampaignPlanSchema` checks for that section (`src/lib/validation.ts`), calls `saveSection(patch)` from `useCampaign`, shows "Saving…" in the header with `aria-live`, and on success increments the version badge, updates "Saved just now", returns to read-only, and shows the toast "Saved. Version 4." Cancel discards the local changes and returns to read-only with no prompt. Only one section is in edit mode at a time; switching sections while editing asks "Discard unsaved changes to this section?" with **Discard** and **Keep editing**. No AI is involved in editing.

**Displayed data per section.** Below. Field names are `CampaignPlan` keys from `F-ai/types.ts`; the section-to-field mapping is `SECTION_FIELDS`.

| Section | Displayed | Editable |
|---|---|---|
| Overview (`OverviewSection`) | `title`; `executive_summary` as the lead paragraph; `business_objective` in a card "Objective"; `timeline.start_date` to `timeline.end_date` as "5 Oct to 1 Nov 2026 · 4 weeks"; `timeline.phases` as a compact list with name, dates and focus; three "at a glance" cards taken from other sections, read-only here: primary audience name, offer name, budget total with currency. | `title`, `executive_summary`, `business_objective`, each phase's `name`, `start_date`, `end_date`, `focus`. Timeline start and end are not editable here (they come from the brief); phases must fall within them, which the form validates with the message "Keep phase dates inside the campaign period." |
| Audience (`AudienceSection`) | `audience.primary` first, as the recommendation: `name` (`h2`), `description`, then three short columns Pains, Motivations, Objections. `audience.secondary` below under "Also worth reaching", collapsed by default with a **Show** toggle. | All fields of both segments; lists limited to 6 items each. |
| Strategy (`StrategySection`) | `positioning.statement` as a pull quote in `text-h3`; `positioning.differentiators` as a list "What sets you apart"; `strategic_rationale` as prose under "Why this plan", `max-w-prose`. | `statement`, `differentiators` (up to 5), `strategic_rationale`. |
| Messaging and Offer (`MessagingSection`) | `messaging.core_message` in `text-h2` as the recommendation; `messaging.supporting_messages` as a list; the offer card: `offer.name` (`h3`), `description`, "How it works" (`mechanics`), "Terms" (`terms`, hidden when null). | All; `terms` may be cleared to null; supporting messages up to 5. |
| Channels (`ChannelsSection`) | One card per channel ordered by `priority` (primary, secondary, support) then `budget_share_percent` descending: `name`, a badge for priority (Primary, Secondary, Support), "`55%` of budget" with a thin bar, `role`, and `why` under "Why". A footer line shows the shares' sum; the normaliser guarantees 100. | `name`, `role`, `priority` (select), `budget_share_percent` (number 0–100), `why`. Save validates the sum equals 100 with the message "Shares must add up to 100%. They currently add up to 95%." Add channel up to 6; remove allowed down to 1. |
| Content Ideas (`ContentSection`) | One card per pillar: `name` (`h3`), `description`, `ideas` as a bulleted list. | All; pillars up to 5, ideas up to 6 per pillar. Renaming a pillar shows the caption "Calendar items keep their pillar name; edit them in the Calendar if needed." |
| Calendar (`CalendarSection` hosting `calendar/CalendarTable`) | See 4.11. | Item by item through the drawer; the section Edit button is replaced by **Add item**. |
| Copy and Ad Scripts (`CopySection`) | "Headlines": `copy.headline_options` as a numbered list, each with a **Copy** ghost button (clipboard; toast "Copied."); "Social captions": `copy.social_captions` as cards; "Email and messages": one card per `copy.email_or_message_copy` with `purpose` as caption, `subject` as `h3`, `body` preserving line breaks; "Ad scripts": one card per `ad_scripts` item with `title`, `channel`, "`30` seconds", `script` in a `bg-sunken` block, and `visual_notes`. | All text; headlines up to 8, captions up to 8, emails up to 3, ad scripts up to 3; `duration_seconds` numeric 5–180. |
| Creative Briefs (`CreativeBriefsSection`) | One card per brief: `title` (`h3`), `format` badge, `purpose`, `key_message`, `visual_direction`, `deliverables` list, "Due `12 Oct 2026`" from `due_date`. | All; up to 4 briefs; `due_date` is a date input validated to fall on or before the campaign end date ("Pick a date on or before the campaign ends."). |
| Budget (`BudgetSection`) | Header line "S$1,500 total" from `budget.total` and `budget.currency`; a table of `budget.line_items` with columns Item (`name`), Category (`category` shown as Media, Content, Offer, Tools, Contingency), Amount, Notes; a footer row "Total" that sums the items. The sum equals `total` after normalisation. | `name`, `category` (select), `amount` (number ≥ 0), `notes`. `total` and `currency` are not editable here because they come from the brief. Save validates the sum equals `total` within 0.01 with the message "Line items must add up to the total (S$1,500). They currently add up to S$1,450." |
| KPIs (`KpisSection`) | One row per KPI: `name` (`h3`), "Target: `target`", "How to measure: `how_to_measure`", cadence badge (Daily, Weekly, End of campaign). | All; up to 8; `cadence` select. |
| Assumptions and Risks (`AssumptionsSection`) | Three groups: "Assumptions" (`assumptions` bullets, including any normaliser notes), "Risks" (each `risks` item as "Risk" and "What to do about it" from `risk` and `mitigation`), "Next actions" (each `next_actions` item with `action`, "When: `when`", effort badge Small, Medium, Large). | All; assumptions up to 12, risks up to 8, next actions up to 10. |

**Actions.** Section navigation; Edit, Save, Cancel per section; lock toggles; Revise with AI; rename campaign; **Delete campaign** in an overflow menu in the page header (same modal as the dashboard; on success navigate to `/app`).

**Empty, loading and error states.** Loading: a skeleton of the page header plus the navigation with the content area showing three text-line skeletons and `aria-busy`. Section with an empty list (for example no ad scripts): the group shows "None yet" in `ink-muted` and, in edit mode, the Add control. Plan fails Zod validation on load: `ui/ErrorState` "This campaign's data looks damaged." with a **Rebuild** button that calls `generate` again with a new `request_id`, and a **Back to dashboard** link. Save failure: toast "We couldn't save that. Your changes are still here; try again." and the section stays in edit mode. Not found: see 4.14.

**Responsive behaviour.** Optimised for laptop and desktop. At `lg` and above: left navigation column plus a content column that fills to `max-w-content`. Below `lg`: tab strip, content full width, cards stack, two-column groups become one column. Tables inside sections (Budget) scroll horizontally inside their container below `md` with the first column sticky.

**Accessibility.** Section change moves focus to the section `h2`. Edit mode announces "Editing Audience" through `aria-live`. Every input in the form has a visible label derived from the field's display name. Lists in edit mode use a fieldset with a legend. Save and Cancel are reachable by keyboard in the header, and Escape while focus is inside the form triggers Cancel after the same discard confirmation.

### 4.11 Editable calendar (`calendar/CalendarTable`, `calendar/CalendarItemDrawer`, `calendar/CalendarFilters`)

**Purpose.** Turn the plan into a working schedule the user can edit item by item, add to and prune. Specified in detail in section 10.

**Components.** Section header with `h2` "Calendar", the caption "`12` items across `4` weeks", the optional filters, and the primary button **Add item**. The table (or cards below `md`). The drawer for editing. `ui/Modal` for delete confirmation.

**Actions.** Row click or Enter on a focused row opens the drawer. Add item opens an empty drawer. Save, Cancel, Delete inside the drawer.

**Displayed data.** `CalendarItemRow` fields ordered by `date` then `sort_order`.

**Empty, loading and error states.** Empty: "No calendar items yet." with the Add item button repeated. Loading follows the workspace skeleton. Save or delete failure: toast "We couldn't save that calendar item. Try again." and the drawer stays open with the values intact. The flags notice mentions clamped dates and low or high counts.

**Responsive behaviour.** Table from `md`; a vertical list of cards below. The drawer is a right-side panel (420px) from `md` and a full-screen sheet below.

**Accessibility.** See section 10 (keyboard operability, status text pairing, focus management).

### 4.12 Saved campaign detail (`pages/Campaign` opened from the dashboard)

**Purpose.** Reopening a campaign lands on the same workspace with the latest saved version. There is no separate read-only detail page.

**Components and actions.** Identical to 4.10. The page reads `status`: `ready` shows the workspace at `?section=overview` (or the section in the query string); `draft` with a saved brief shows the Brief review with **Build my campaign**; `draft` without a brief redirects to `/app/new`; `generating` shows the generation state (the client polls the campaign row every 3 seconds until it leaves `generating`); `error` shows `ui/ErrorState` with `last_error` translated to the matching message from section 13 and a **Try again** button (same `request_id` as stored in the last ledger row is not available to the browser, so the retry uses a new `request_id`; the server's daily cap and idempotency still protect cost).

**Displayed data.** Latest `campaign_plans` row (`getLatestPlan`), the brief, and the calendar rows. The version badge shows `version`, and the header caption shows the plan's `created_at` as "Saved …".

**Empty, loading and error states.** As 4.10 and 4.14.

**Responsive behaviour and accessibility.** As 4.10.

### 4.13 Account and settings with AI usage summary (`pages/Settings`)

**Purpose.** Show who is signed in, let them sign out, and make AI cost visible. Specified in detail in section 12.

**Components.** `layout/AppShell`; `h1` "Settings"; `ui/Card` "Account" with the email and a secondary **Sign out** button; `ui/Card` "AI usage" with summary tiles and the recent-events table.

**Actions.** Sign out → `/`. **Refresh** ghost button on the AI usage card reloads the numbers.

**Displayed data.** `UsageSummaryRow` from `getUsageSummary` and the last 20 `AiUsageEventRow` items from `listRecentUsage`.

**Empty, loading and error states.** Loading: tiles show "—" and `aria-busy`. Empty: "No AI calls yet. Build a campaign to see usage here." Error: "We couldn't load your usage." with Retry.

**Responsive behaviour.** Page is `max-w-prose` wide; tiles two per row below `sm`, four from `sm`; the events table scrolls horizontally below `md`.

**Accessibility.** Tiles are a description list (`dl`) so each number has its label. The table has a caption.

### 4.14 Error, retry and not-found states (`ui/ErrorState`, `components/ErrorBoundary`, `pages/NotFound`)

**Purpose.** Fail calmly, explain in one sentence, and offer the one action that helps.

**Components.** `ui/ErrorState`: an icon from `lucide-react` (`AlertCircle`) in `state-danger`, a one-line title, an optional second line, a primary action button, an optional secondary link, and, when the error came from the Edge Function, a caption "Reference: `request_id`" in `font-mono text-caption text-ink-muted` so support can find the ledger row. `components/ErrorBoundary` wraps the app (`src/main.tsx`) and renders a full-page `ui/ErrorState` "Something went wrong." with **Reload** and a link to the dashboard. `pages/NotFound` renders "We couldn't find that page." with a link **Go to dashboard** (or **Go to campAI** when signed out).

**Actions.** Retry repeats the failed operation once per click. For AI operations the retry keeps the `request_id` when the first attempt did not return a definitive failure (timeout or network) and generates a new one otherwise, as implemented in `src/lib/api.ts`.

**Displayed data.** The safe message and code from `AiError` or the plain-language message from the Supabase client wrapper. Never a stack trace, raw error body, prompt or key.

**Variants and their copy.** Campaign not found (RLS hides other users' rows): "We couldn't find that campaign." with **Go to dashboard**. Daily cap: "You've reached today's limit of 25 AI actions. It resets at midnight UTC." with no retry button. Duplicate: "That request was already handled. Start a new one." with **Start again**. Network: "We couldn't reach campAI. Check your connection and try again." with **Retry**. AI outcome errors: the messages in section 13, with **Try again** except for the refusal, which offers only **Edit brief**.

**Responsive behaviour.** Centred, `max-w-prose`, full width below `md`.

**Accessibility.** The container has `role="alert"` when it replaces content the user was waiting for, and `role="status"` for inline notices. Focus moves to the title when the state appears. The action button is the next tab stop.

---

## 5. The guided-question sequence

The nine questions are defined once in `QUESTIONS` in `src/lib/brief.ts` (snippet `I-code-guide/src-snippets/src__lib__brief.ts`). The interface must render that array; the copy below is reproduced from it for review and must not be retyped in components.

### 5.1 Order, copy and examples

| Step | Key | Label | Helper | Placeholder | Example answers | Input kind |
|---|---|---|---|---|---|---|
| 1 | `goal` | What do you want this campaign to achieve? | Say it the way you'd say it to a friend. We'll turn it into a plan. | More customers during weekdays | More customers during weekdays · Sell out our new product launch · Get 50 people to our opening event | Textarea, 3 rows |
| 2 | `business` | What's your business? | A sentence is plenty. | A small café near the business district | A small café near the business district · An online store selling handmade candles · A mobile dog-grooming service | Single-line input |
| 3 | `product_or_service` | What are you promoting? | The product, service or event this campaign is about. | Coffee, drinks and lunch | Coffee, drinks and lunch · Our new autumn candle collection · Full grooming packages | Single-line input |
| 4 | `audience_clues` | Who are you hoping to attract? | Don't worry about marketing terms. Who buys from you, or who should? | People who work nearby on weekdays | People who work nearby on weekdays · Gift shoppers aged 25 to 45 · Dog owners within 10 km | Textarea, 3 rows |
| 5 | `budget` | How much can you spend in total? | Include ads, offers and any content costs. We'll split it for you. | 1500 | S$1,500 · US$800 · €2,000 | Budget (amount + currency) |
| 6 | `market` | Where are your customers? | A city, a neighbourhood, or a country. | Singapore | Singapore · Tanjong Pagar, Singapore · Australia-wide, online | Single-line input |
| 7 | `schedule` | When should it start, and for how long? | We suggest starting on a Monday. Four weeks is a good first campaign. | (none) | Next month, 4 weeks · Next Monday, 2 weeks · 1 November, 6 weeks | Schedule (date + duration) |
| 8 | `existing_assets` | What do you already have? | Social accounts, an email list, a website, photos, a shopfront. Anything we can use. | An Instagram account and a small email list | An Instagram account and a small email list · A website and a Facebook page · Nothing yet | Textarea, 3 rows |
| 9 | `tone_and_constraints` | Anything about tone, or anything to avoid? | Optional. For example: friendly and warm; no discounts over 20%; no TikTok. | Friendly and down to earth. Nothing to avoid. | Friendly and down to earth · Premium and calm; never use exclamation marks · No discounts, we compete on quality | Textarea, 3 rows; **Skip** available |

When `brief_check` succeeded, the label shown is the model's `question` for that field if it is longer than five characters; otherwise the fixed label. The helper, placeholder and examples always come from `QUESTIONS`.

### 5.2 Defaults

From `emptyDraft()`: currency `SGD`, market `Singapore`, start date the first Monday of next month (`firstMondayOfNextMonth()`), duration 4 weeks. These defaults are pre-filled in the fallback sequence and used as `suggested_*` fallbacks after smart start. The end date is always computed in code as start date plus (weeks × 7) minus 1 day (`endDateFor`).

### 5.3 Which questions are shown

After a successful smart start, `questionsToAsk(statuses)` returns only the fields whose status is `inferred` or `missing`, in the fixed order. `stated` fields are skipped and appear on the review screen. If every field is `stated` (rare), the flow goes straight to the review. In the fallback (`statuses === null`), all nine are shown.

Progress text counts only the questions being asked: "Question 2 of 6". `ui/ProgressDots` shows one dot per asked question, filled up to the current one.

### 5.4 Prefills and the assumption marker

Fields with status `inferred` are prefilled with the model's `value`; `missing` fields are prefilled with `suggested_default` (or the suggested amount, currency, start date and duration for budget and schedule). Both show the badge "We assumed this — change it if it's wrong" above the input, in `accent-soft` background with `ink` text. The badge disappears once the user edits the value on that step (status stays recorded for the review screen, where the row still says "We assumed this" if the value was not changed, and "You told us" if it was).

### 5.5 Buttons

**Back** (secondary): hidden on the first asked question; otherwise returns to the previous asked question. **Next** (primary): validates and advances; on the last asked question its label is **Review brief**. **Skip** (ghost): present only on step 9, the optional tone question; it advances with an empty value. There is no Skip on any other step because every other field is required for generation.

### 5.6 The budget step

Two controls in one row (stacked below `sm`): a numeric `ui/Input` labelled "Amount" (inputmode `decimal`, placeholder "1500", thousands separators added on blur, accepts pasted values such as "S$1,500" by stripping non-digits) and a `ui/Select` labelled "Currency" with options SGD, USD, EUR, GBP, INR, AUD, MYR and "Other". Choosing Other reveals a three-letter text input labelled "Currency code" (uppercased as typed, validated by `validateDraft` with "Use a three-letter currency code like SGD or USD."). Example chips fill both amount and currency (for example "US$800" sets 800 and USD). Validation: "Enter a budget greater than zero."

### 5.7 The schedule step

A date input labelled "Start date" (native `type="date"`, minimum tomorrow, default the first Monday of next month, helper "We suggest starting on a Monday" shown from `QUESTIONS`), and a `ui/Select` labelled "Duration" with options 1 to 12 weeks (default 4). Below both, a live line in `text-small text-ink-secondary` with `aria-live="polite"`: "Runs Mon 5 Oct 2026 to Sun 1 Nov 2026 (4 weeks)". If the chosen start date is not a Monday, a quiet caption says "That's a Wednesday. Mondays make weekly planning easier, but any day works." and nothing is blocked. Example chips set both controls: "Next month, 4 weeks" sets the default date and 4; "Next Monday, 2 weeks" sets the coming Monday and 2; "1 November, 6 weeks" sets 1 November of the current year (or next year if that date has passed) and 6. Validation messages: "Pick a start date after today." and "Choose between 1 and 12 weeks."

### 5.8 The fallback

If smart start fails for any reason other than the daily cap, or the user chose **Skip and answer step by step**, the app shows all nine questions with defaults and no badge, records `used_ai = false`, and shows **no error message**. The free text the user typed is placed into the goal field so their words are not lost. The user should not be able to tell whether AI ran, apart from having more questions to answer.

---

## 6. Brief review screen

Layout: the restatement card first (only when `brief_check` succeeded and `restatement` is non-empty), then the table, then the buttons.

**Restatement card** ("In other words"): the `restatement` paragraph in `text-body`, followed by the caption "What we assumed" and the `assumptions` list as bullets. If the list is empty the caption is omitted.

**Table** (caption "Your campaign brief"; columns Field, Your answer, Source, Action):

| Row | Field label | Value shown | Badge rule |
|---|---|---|---|
| 1 | Goal | `goal` | |
| 2 | Business | `business` | |
| 3 | Promoting | `product_or_service` | |
| 4 | Audience | `audience_clues` | |
| 5 | Budget | amount with separators + currency code | |
| 6 | Market | `market` | |
| 7 | Schedule | "Mon 5 Oct 2026 for 4 weeks (ends Sun 1 Nov 2026)" | |
| 8 | Existing assets | `existing_assets` | |
| 9 | Tone and constraints | `tone_and_constraints` or "None given" | |

Badge rule for every row: **You told us** (`surface` background, `ink-secondary` text) when the field status is `stated`, or when the user edited the value on a follow-up step (the field is in `answered_fields` and the value differs from the prefill). **We assumed this** (`accent-soft` background, `ink` text) when the status is `inferred` or `missing` and the user accepted the prefill or default unchanged. In the fallback sequence every answered row is "You told us" and untouched defaults (currency, market, schedule) are "We assumed this".

Each row has an **Edit** link (accessible name "Edit goal", "Edit budget", and so on) that opens that question step alone; Next on that step returns to the review.

Buttons: **Build my campaign** (primary, right-aligned on `md` and up, full width below) and **Back** (secondary). Under the primary button a caption: "Takes 30 to 90 seconds. Everything can be edited afterwards."

---

## 7. Generation and loading state

The generation call is one synchronous request that typically takes 30 to 90 seconds (acceptance target 45 seconds, server timeout 110 seconds). The staged messages are driven by a timer in the browser, not by server events, and must never claim a step is finished. Each message is present tense and describes what the plan will contain, so that the wait doubles as an explanation.

| Elapsed | Message |
|---|---|
| 0 s | Reading your brief |
| 5 s | Choosing who to target |
| 12 s | Shaping the offer and message |
| 22 s | Picking channels and splitting the budget |
| 35 s | Writing copy and the calendar |
| 55 s | Checking numbers and dates |
| 75 s | Almost there… |
| 100 s | This is taking longer than usual — we'll keep waiting up to two minutes |

Rules:

1. Messages advance on the timer regardless of the response; when the response arrives the screen switches immediately to the workspace, even if the timer is on an early message. Do not pad the wait to reach later messages.
2. Do not fake completion: never show "Done" or a full progress bar before the response is in hand. The bar is indeterminate throughout.
3. No Cancel button. The server keeps running after the browser leaves, the ledger row is written either way, and the `request_id` lets a retry reuse the stored result instead of paying twice. Offering Cancel would imply a refund of time and cost that cannot happen. The caption tells the user they may keep the tab open; if they navigate away the dashboard shows the campaign as Building and re-entering it resumes polling.
4. If the server returns a timeout (504) or the browser's own 120-second limit fires, show the error state with "This is taking longer than usual. Please try again." and **Try again** reusing the same `request_id`; if the first call did finish server-side, the retry replays the stored result within a second.
5. The `aria-live="polite"` region announces each new message once; the progress bar's `aria-valuetext` mirrors it.

---

## 8. Workspace flags notice (`workspace/FlagsNotice`)

`GenerateResponse.flags` and `ReviseResponse.flags` carry `ValidationFlag` items written by the normaliser (never by the model). They are stored with the plan version and shown once per browser session per plan version as one calm notice at the top of the workspace, above the section content and below the Revise bar.

Appearance: `rounded-md`, `bg-accent-soft`, 1px `line` border, an `Info` icon from `lucide-react` in `accent`, title "We adjusted a few things" in `text-small` weight 500, a bulleted list of one line per flag in `text-small text-ink-secondary`, and a ghost **Dismiss** button (`aria-label="Dismiss notice"`). Dismissal is stored in `sessionStorage` keyed by campaign id and plan version, so the notice returns after a new version with new flags but not on every navigation.

Line copy per code (the `message` field from the server may be shown instead when present; these are the fallbacks and the tone to match):

| Code | Line |
|---|---|
| `budget_rescaled` | We scaled the budget lines so they add up to your total. |
| `channel_shares_rescaled` | We adjusted channel shares so they add up to 100%. |
| `date_clamped` | We moved one item (or `n` items) inside your campaign dates. |
| `calendar_count_low` | The calendar has fewer items than usual; add more from the Calendar section if you like. |
| `calendar_count_high` | The calendar has more items than usual; remove any you don't need. |
| `pillar_name_fixed` | We matched a calendar item's pillar to one of your content pillars. |
| `timeline_adjusted` | We aligned the timeline with your start and end dates. |

Flags with a `ref` that points at a calendar item also mark that item's row in the calendar with a small `state-warning` dot and the tooltip text "Adjusted", paired with the word "Adjusted" in the row's Notes cell for non-visual users. The notice is informational only; there is no action to accept or reject it.

---

## 9. Editable calendar

### 9.1 Table (`calendar/CalendarTable`)

Columns, in order: Date (formatted "Mon 5 Oct"), Week (`week_number` as "W1"), Channel, Format, Title, Pillar (`content_pillar`), Status, and an actions column with an **Edit** ghost icon button (`aria-label="Edit <title>"`). Rows are sorted by `date` ascending then `sort_order`; the sort is fixed and is announced in the Date header with `aria-sort="ascending"`. Week boundaries are marked by a slightly stronger row separator (`line-strong`) and a small "Week 2" caption row spanning all columns, which also serves as a landmark for scanning.

Status is shown as a coloured dot plus text: Planned (`ink-muted` dot), In progress (`state-info`), Done (`state-success`), Skipped (`state-warning`). The text is always present; colour is never the only signal. Rows with status `done` show the title in `ink-secondary`; rows with `skipped` show it with a line-through.

Header: `h2` "Calendar", the caption "`12` items across `4` weeks", the filters, and the primary button **Add item**.

### 9.2 Drawer (`calendar/CalendarItemDrawer`)

Opens from the right (`md` and up, 420px, `bg-raised`, `shadow-card`) or as a full-screen sheet below `md`. Title: the item's `title` for an existing item or "New calendar item" for a new one; caption "Week `2` · `Mon 12 Oct`".

Fields, all plain inputs with visible labels, in this order: Date (date input, min campaign start, max campaign end; the week number is recomputed from the date on save), Channel (text input with a datalist of the plan's channel names), Format (text), Title (text, required), Objective (text), Content pillar (select of the plan's pillar names plus "Other" revealing a text input), Hook (textarea 2 rows), Body (textarea 5 rows), CTA (text, labelled "Call to action"), Creative direction (textarea 3 rows), Ad script (textarea 5 rows, labelled "Ad script (optional)"; empty saves as null), Status (select: Planned, In progress, Done, Skipped mapping to `planned`, `in_progress`, `done`, `skipped`), Notes (textarea 2 rows).

Footer, sticky: **Save** (primary), **Cancel** (secondary), and for existing items **Delete** (destructive, left-aligned). Delete opens `ui/Modal` "Delete this calendar item?" with body "This removes '`title`' from the calendar." and buttons **Delete item** and **Cancel**. Save calls `editCalendarItem` or `createCalendarItem` from `useCampaign`; each writes a new plan version, so the version badge increments and the toast reads "Saved. Version 5." Delete calls `removeCalendarItem` with the same effect and the toast "Item deleted. Version 6."

Validation on Save: Title required ("Add a title."); Date inside the campaign period ("Pick a date between `5 Oct` and `1 Nov`."). Everything else may be empty.

### 9.3 Add item

**Add item** opens the drawer with Date set to the first campaign day that has no item (or the start date), Status Planned, Week computed, Channel set to the primary channel's name, Content pillar set to the first pillar, and other fields empty.

### 9.4 Filters (Should-have; `calendar/CalendarFilters`)

Optional, built only after the must-have flow passes twice. Three `ui/Select` controls in the header: Channel (All plus the distinct channels in the table), Week (All plus W1 to Wn), Status (All plus the four statuses). Filtering is client-side, keeps the sort, and shows "`4` of `12` items" in the caption with a **Clear filters** link. Filters reset when the campaign changes.

### 9.5 Keyboard operability

Rows are focusable (`tabindex="0"`) and act as buttons: Enter or Space opens the drawer. Arrow Up and Down move between rows when a row has focus. The Edit icon button is also in the tab order for screen readers that skip row semantics. Inside the drawer, focus starts on the first field, Tab cycles within the drawer (focus trap), Escape triggers Cancel (with the unsaved-change confirmation if fields changed), and on close focus returns to the row or the Add item button that opened it. The delete confirmation modal traps focus and returns it to the Delete button on cancel or to the Add item button after deletion.

### 9.6 Mobile

Below `md` the table becomes a list of `ui/Card` items, one per calendar item, grouped under "Week 1", "Week 2" headings. Each card shows the date and channel on the first line (`text-small text-ink-secondary`), the title (`text-h3`), the format and pillar as chips, and the status dot plus text on the last line. Tapping a card opens the full-screen drawer. The Add item button is full width and sticky at the bottom of the section.

---

## 10. Revision: Apply and Discard

### 10.1 Revise bar (`revision/ReviseBar`)

Sits directly under the page header on every workspace section. Collapsed: one line with a `Sparkles` icon from `lucide-react` in `ink-secondary`, the text "Revise with AI" and a caption "Tell campAI what to change". Focusing or clicking it expands the bar in place:

- A `ui/Textarea` labelled "Tell campAI what to change" (3 rows), 3 to 500 characters, with a live counter from 400 characters, placeholder "For example: make it suitable for younger customers".
- Three example chips that fill the textarea: **Make it suitable for younger customers**, **Cut the budget by 30%**, **Add more email**.
- The line "Locked sections won't change: `Budget`, `Calendar`" listing current locks, or "No sections are locked. Lock a section from the navigation to protect it." when none.
- Primary button **Propose changes**, secondary **Cancel** (collapses the bar and clears the text).

Validation: fewer than 3 characters shows "Tell us a little more about what to change."; more than 500 shows "Keep the instruction under 500 characters." Submitting calls `requestRevision(instruction)` with the current `lockedSections`. While waiting the button reads "Proposing…", the textarea is disabled, and an `aria-live` line says "Working on your changes. This usually takes 30 to 90 seconds." with the same staged messages as generation from 22 s onward ("Picking channels and splitting the budget" is replaced by "Reworking the sections you asked about"). Editing a section and revising at the same time is not allowed: if a section is in edit mode, Propose changes is disabled with the caption "Save or cancel your edit first."

### 10.2 Lock toggles

Each item in `layout/WorkspaceNav` has a lock toggle on its right: an icon button (`Lock` or `LockOpen` from `lucide-react`, 32px square within the 40px row) with `aria-pressed` and `aria-label="Lock Budget"` / `"Unlock Budget"`. Locked sections show the icon in `accent` and a `ui/Badge` **Locked** (`text-caption` uppercase, `accent-soft`) next to the label; the section header repeats the badge. Below `lg`, where the tab strip hides the toggle, the section header carries a **Lock section** / **Unlock section** secondary button. Locks are kept in the browser (`useCampaign` state) for the current campaign visit and sent with each revision request; they are not saved to the database. Locking all twelve sections disables Propose changes with the caption "Everything is locked, so nothing can change. Unlock at least one section."

### 10.3 Proposal view (`revision/ProposalDiff`)

When `requestRevision` resolves, the bar is replaced by a proposal panel (`ui/Card`, `rounded-xl`, `shadow-card`, `bg-raised`) that pushes the section content down; the page does not navigate. Focus moves to the panel's `h2`.

Content, top to bottom:

1. `h2` "Proposed changes" and the caption "Based on version `3`. Nothing is saved until you apply."
2. The `change_summary` paragraph in `text-body`.
3. "Changed sections:" followed by one chip per key in `changed_sections`, using `SECTION_LABELS`, in `accent-soft`. Each chip is a button that scrolls to that section's comparison below. If `changed_sections` is empty (the model changed nothing meaningful, or only locked sections were touched), the panel says "campAI didn't find anything to change for that instruction." with only a **Close** button.
4. Per changed section, a comparison block with the section label as `h3`. Layout: on `xl` and above a **Before / After** segmented toggle (default After) switches the block between the current plan's section and the proposed one, rendered with the same read-only section component; a **Show both** option stacks Before above After. Below `xl`: stacked only, Before first with the caption "Before (version `3`)", After second with "After (proposed)". Text that differs is not diffed word by word; the whole section is shown in each state, which is simpler to read and to build. Locked sections never appear here.
5. Footer, sticky at the bottom of the panel on tall content: **Apply changes** (primary) and **Discard** (secondary).

### 10.4 Apply and Discard

**Apply changes** calls `applyProposal` (`apply_revision` in the database, one transaction: new plan version with `source = 'revised'`, calendar rows rebuilt, revision marked `applied`). The button reads "Applying…" while it runs. On success: the panel closes, the plan reloads, the version badge increments, the flags notice appears if the proposal carried flags, and a toast says "Applied. Version 4." with the version returned by the call. Focus returns to the collapsed Revise bar.

**Discard** calls `discardProposal` (status `discarded`). On success the panel closes, nothing else changes, and a toast says "Discarded. Your plan is unchanged."

Failure of either: toast "We couldn't apply that. Try again." or "We couldn't discard that. Try again." with the panel kept open. If the campaign was edited in another tab and the plan version no longer matches `base_plan_version`, the apply call fails and the message is "This plan changed since the proposal was made. Discard it and ask again."

Only one proposal can be open at a time; the Revise bar is hidden while the panel is shown. Section editing and calendar editing are disabled while a proposal is open (the Edit buttons show the caption "Apply or discard the proposal first").

---

## 11. Settings and the AI usage summary

**Account card**: the `dt`/`dd` pair Email → the signed-in email, and a secondary **Sign out** button. Caption below: "Signed in with email and password."

**AI usage card** (title "AI usage", caption "Every AI action campAI takes on your behalf is recorded here, with its tokens and estimated cost. This is how we keep AI cost measurable."):

Summary tiles (a `dl` rendered as four tiles per row on `sm` and up):

| Tile label | Value | Notes |
|---|---|---|
| Total calls | `total_calls` | |
| Successful | `successful_calls` | |
| Failed | `failed_calls` | Includes refused, timed out and rate-limited attempts |
| Today | "`3` of 25" from `calls_today` and the limit | Caption "Resets at midnight UTC"; turns `state-warning` text at 20 and `state-danger` at 25 |
| Input tokens | `input_tokens` | Thousands separators |
| Cached input | `cached_input_tokens` | |
| Output tokens | `output_tokens` | |
| Total tokens | `total_tokens` | |
| Estimated cost | "US$`0.1834`" from `estimated_cost_usd` | Always four decimals; caption "Estimated from list prices at the time of each call" |

The daily limit of 25 is the default of `AI_DAILY_LIMIT_PER_USER`; the browser shows 25 as a constant because the secret is not exposed. If the team changes the secret, this constant in `pages/Settings` must change too (noted in `I-code-guide/env.example`).

Recent events table (caption "Last 20 AI actions", newest first, from `listRecentUsage(20)`): columns Time (`created_at` as "5 Oct, 14:32" in the user's local time, absolute date in `title`), Operation (`brief_check` shown as "Brief check", `generate` as "Generate", `revise` as "Revise"), Status (`status` shown in plain words: Success, Invalid request, Refused, Incomplete, Schema invalid, Timed out, Rate limited, Service error, Internal error, Daily limit; with a dot in `state-success` for Success and `state-danger` otherwise, always with the text), Tokens (`total_tokens`), Cost (`estimated_cost_usd` with four decimals). A row whose `error_code` contains `pricing_missing` shows "US$0.0000" with the tooltip and visible caption "No price on file for this model". Latency is not shown in the table to keep it narrow; it remains in the ledger.

Sentence at the bottom of the card, in `text-small text-ink-secondary`: "These figures come from the usage ledger written by the server for every attempt, including failures. They are the proof that campAI's AI cost is measurable per account, per campaign and per action."

A **Refresh** ghost button reloads both the summary and the table.

---

## 12. Final UX copy

All user-facing strings, grouped. Strings marked (file) are defined in code and must be imported, not retyped.

### 12.1 Labels, buttons and helper text

| Where | Copy |
|---|---|
| Wordmark | campAI |
| Top bar links | Dashboard · Settings · Sign out |
| Landing | Get started · Sign in · Open dashboard |
| Auth | Create your account · Create account · Sign in · Show · Hide · At least 6 characters · Already have an account? Sign in · New to campAI? Create an account |
| Dashboard | Your campaigns · New campaign · Rename · Delete · Delete this campaign? · This removes the brief, the plan, all versions and the calendar. This can't be undone. · Delete campaign · Cancel |
| Status badges | Draft · Building · Ready · Needs attention |
| Smart start | Tell us what you want, in your own words · One or two sentences is enough. We'll work out the rest and only ask what we still need. · Use this example · Continue · Skip and answer step by step · Reading your brief… |
| Questions | (file: `QUESTIONS` labels, helpers, placeholders, examples) · Question 2 of 6 · Back · Next · Review brief · Skip · We assumed this — change it if it's wrong · Amount · Currency · Other · Currency code · Start date · Duration · Runs Mon 5 Oct 2026 to Sun 1 Nov 2026 (4 weeks) |
| Brief review | Here's your brief · In other words · What we assumed · Your campaign brief · You told us · We assumed this · Edit · None given · Build my campaign · Back · Takes 30 to 90 seconds. Everything can be edited afterwards. |
| Generation | Building your campaign · (the eight staged messages in section 7) · Usually 30 to 90 seconds. You can keep this tab open. · What's happening |
| Workspace | (file: `SECTION_LABELS`) · Edit · Save · Cancel · Saving… · Version 3 · Saved 2 minutes ago · Add · Remove · Copy · Copied. · None yet · Locked · Lock section · Unlock section · Discard unsaved changes to this section? · Discard · Keep editing |
| Flags notice | We adjusted a few things · Dismiss · (seven lines in section 8) |
| Calendar | Calendar · 12 items across 4 weeks · Add item · New calendar item · Date · Week · Channel · Format · Title · Objective · Content pillar · Hook · Body · Call to action · Creative direction · Ad script (optional) · Status · Notes · Planned · In progress · Done · Skipped · Delete · Delete this calendar item? · Delete item · Clear filters · All |
| Revision | Revise with AI · Tell campAI what to change · Make it suitable for younger customers · Cut the budget by 30% · Add more email · Locked sections won't change: … · No sections are locked. Lock a section from the navigation to protect it. · Propose changes · Proposing… · Proposed changes · Based on version 3. Nothing is saved until you apply. · Changed sections: · Before · After · Show both · Before (version 3) · After (proposed) · Apply changes · Applying… · Discard · Close |
| Settings | Settings · Account · Email · Sign out · AI usage · Total calls · Successful · Failed · Today · Resets at midnight UTC · Input tokens · Cached input · Output tokens · Total tokens · Estimated cost · Last 20 AI actions · Time · Operation · Status · Tokens · Cost · Refresh |

### 12.2 Empty states

| Where | Copy |
|---|---|
| Dashboard | Start your first campaign · Tell campAI what you want in a sentence. It asks a few questions, then builds the whole plan: audience, message, offer, channels, calendar, copy, budget and KPIs. · Takes about two minutes. You can change everything afterwards. |
| Calendar | No calendar items yet. |
| Section list | None yet |
| Settings usage | No AI calls yet. Build a campaign to see usage here. |
| Proposal with no changes | campAI didn't find anything to change for that instruction. |

### 12.3 Toasts

Saved. Version N. · Applied. Version N. · Discarded. Your plan is unchanged. · Item deleted. Version N. · Campaign deleted. · Copied. · We couldn't save that. Your changes are still here; try again. · We couldn't save that calendar item. Try again. · We couldn't apply that. Try again. · We couldn't discard that. Try again.

Toasts appear bottom-centre (bottom-right from `lg`), one at a time, for 4 seconds (8 seconds for failures), with `role="status"`; failure toasts also have a **Dismiss** button and do not auto-dismiss while focused.

### 12.4 Inline validation

From `validateDraft` (file): Please add your goal. · Please add your business. · Please add what you're promoting. · Please add who you want to attract. · Please add where your customers are. · Please add what you already have (or write 'nothing yet'). · Keep this under 500 characters. · Keep this under 1000 characters. · Enter a budget greater than zero. · Use a three-letter currency code like SGD or USD. · Pick a start date after today. · Choose between 1 and 12 weeks.

Specified here: Enter a valid email address. · Add a little more so we can help. · Tell us a little more about what to change. · Keep the instruction under 500 characters. · Add a title. · Pick a date between 5 Oct and 1 Nov. · Shares must add up to 100%. They currently add up to 95%. · Line items must add up to the total (S$1,500). They currently add up to S$1,450. · Keep phase dates inside the campaign period. · Pick a date on or before the campaign ends.

### 12.5 Error messages

| Source | Code or case | Message |
|---|---|---|
| Edge Function (`F-ai/prompts.md` 4.2) | `incomplete_output` | The plan came back unfinished. Try again; if it happens twice, shorten your brief. |
| Edge Function | `refused` | campAI can't build a campaign for this brief. Please rephrase it or contact support. |
| Edge Function | `schema_invalid` | Something went wrong while building your plan. Please try again. |
| Edge Function | `rate_limited` | campAI is busy, try again in a minute. |
| Edge Function | `upstream_error` | campAI couldn't reach its AI service. Please try again. |
| Edge Function | `timeout` | This is taking longer than usual. Please try again. |
| Edge Function | `internal_error` | Something went wrong. Please try again. |
| Edge Function | `daily_limit_reached` | You've reached today's limit of 25 AI actions. It resets at midnight UTC. |
| Edge Function | `duplicate_request` | That request was already handled. Start a new one. |
| Edge Function | `not_found` | We couldn't find that campaign. |
| Edge Function | `brief_missing` | Finish the brief before building the campaign. |
| Edge Function | `plan_missing` | Build the campaign before asking for changes. |
| Edge Function | `invalid_request` | Something went wrong. Please try again. |
| Edge Function | `unauthenticated` | Your session has expired. Sign in again. |
| Browser | Network failure | We couldn't reach campAI. Check your connection and try again. |
| Browser | Damaged plan | This campaign's data looks damaged. |
| Browser | Load failures | We couldn't load your campaigns. · We couldn't load your usage. · We couldn't save your brief. Check your connection and try again. |
| Browser | Version mismatch on apply | This plan changed since the proposal was made. Discard it and ask again. |
| Browser | Error boundary | Something went wrong. |
| Browser | Not found page | We couldn't find that page. |
| Auth (`src/hooks/useAuth.tsx`) | Invalid credentials | That email and password don't match. Try again. |
| Auth | Already registered | There's already an account with this email. Sign in instead. |
| Auth | Weak password | Use a password with at least 6 characters. |
| Auth | Rate limited | Too many attempts. Wait a minute and try again. |
| Auth | Unconfirmed email | This email hasn't been confirmed yet. Check your inbox. |
| Auth | Other | Something went wrong signing you in. Please try again. |

Error action labels: Try again · Retry · Reload · Start again · Edit brief · Rebuild · Go to dashboard · Go to campAI · Back to dashboard. Every Edge Function error state shows "Reference: `request_id`" when a request ID is available.

---

## 13. Accessibility checklist

Target: WCAG 2.1 level AA basics, verifiable by hand in the Part K accessibility test.

1. **Contrast.** `ink` (#f4f4f2) on `bg` (#0a0a0a) is about 18:1 and `ink-secondary` (#a3a3a3) on `bg` is about 8:1; both pass for all text sizes. `ink-muted` (#737373) on `bg` is about 4.3:1, which passes only for large text (18.66px bold or 24px regular), so it is limited to captions, timestamps and placeholders and never used for body copy, labels or button text. `ink-inverse` on `accent` (#0a0a0a on #c9a86a) is about 9:1 and passes. State colours are used for icons, dots and short labels with adjacent text, and each passes 3:1 against `bg` for non-text contrast.
2. **Visible focus.** Every interactive element uses `focus-visible:shadow-focus`; the ring is a 2px accent ring offset by 2px of background, visible on every surface. Focus is never removed with `outline-none` without the shadow replacement.
3. **Labels.** Every input, textarea and select has a visible `label` element; helper and error text are attached with `aria-describedby`; icon-only buttons have `aria-label`; badges are text.
4. **Live regions.** Progress text, staged generation messages, "Saving…", "Editing …", the schedule's computed end date, and toasts use `aria-live="polite"` (`role="status"`); errors that replace expected content use `role="alert"`.
5. **Keyboard.** All flows are completable with a keyboard: Tab order follows the visual order; Enter submits single-line forms; Ctrl+Enter or Cmd+Enter submits textareas; Escape closes drawers, modals, menus and the expanded Revise bar; arrow keys move between calendar rows and within menus.
6. **Focus management.** Focus moves to the new `h1` or `h2` on step and section changes; drawers and modals trap focus and return it to the opener on close; error states receive focus on their title.
7. **Structure.** One `h1` per page; sections use `h2`, cards `h3`; the workspace navigation is a `nav` with `aria-label="Campaign sections"` and `aria-current="page"` on the selected item; tables have captions and header cells; the usage summary is a description list.
8. **No colour-only status.** Every status dot, badge and flag marker is paired with text (Planned, Done, Locked, Adjusted, You told us, We assumed this).
9. **Reduced motion.** Under `prefers-reduced-motion: reduce`, transitions are disabled, skeleton pulses and the progress bar are static, and the spinner is replaced by text.
10. **Touch and size.** Interactive elements are at least 40px tall; text is at least 12px and body text 16px; the layout works at 320px width without horizontal page scrolling; pinch zoom is not disabled.
11. **Language and titles.** `html lang="en"`; every page sets `document.title` to "`Page name` · campAI" (for example "Calendar · Weekday Regulars · campAI").
12. **Forms recover.** Failed saves keep the user's input; validation messages name the field and the fix.

---

## 14. Responsive rules summary

| Range | Rules |
|---|---|
| Below `sm` (under 640px) | Single column everywhere. Buttons in a row stack full width, primary on top. Email in the top bar becomes an icon button. Budget amount and currency stack. Dashboard cards one per row. |
| `sm` to below `md` (640–767px) | Dashboard cards two per row. Button rows side by side. Calendar still shown as cards. Auth card gains side margins. |
| `md` to below `lg` (768–1023px) | Calendar table appears with horizontal scroll inside its container if needed; drawer becomes a 420px side panel. Brief review becomes a table. Landing headline at `text-display`. Workspace navigation is the horizontal tab strip with lock buttons moved into section headers. |
| `lg` to below `xl` (1024–1279px) | Workspace gets the 240px left navigation with lock toggles. Dashboard cards three per row. Toasts move to bottom-right. Gutters `px-8`. |
| `xl` and up (1280px+) | Content column reaches `max-w-content` (72rem). Proposal comparison offers the Before/After toggle and Show both. Landing uses the `22` and `30` spacing tokens. |
| All sizes | Reading text capped at `max-w-prose` (42rem). No horizontal page scroll. Sticky elements: top bar, workspace navigation (at `lg`+), drawer footer, proposal footer, mobile Add item button. The main campaign workspace is optimised for laptop and desktop; the intake flow, dashboard and settings are equally comfortable on a phone. |
