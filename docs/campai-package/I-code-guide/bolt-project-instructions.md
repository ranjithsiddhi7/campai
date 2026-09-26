<!-- AI note: Short rules to paste into Bolt's project-level instructions setting (if the plan offers one); otherwise prepend to every Bolt prompt.
     Owner: Claude Code maintains this text; the human pastes it into Bolt. -->

# Bolt project instructions for campAI (paste into Bolt → Project settings → Instructions)

```
You are building campAI, a Campaign Operating System for small-business owners. Premium, minimalist, editorial look: near-black #0a0a0a background, off-white text, one subtle accent, generous whitespace, no gradients/glow/illustrations.

RULES
1. Stack is fixed: Vite + React + TypeScript + Tailwind. Only these dependencies: react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react. No state library (use React context + hooks). No component library. If you think another library is needed, stop and ask.
2. You own src/ only. Never create or edit SQL, supabase/ files, CLAUDE.md, AGENTS.md or docs/. Never modify src/types/campaign.ts or src/lib/validation.ts (import them only).
3. One change per prompt. Do exactly what the prompt asks; do not add features, screens, or "improvements" that were not requested.
4. Secrets: the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY). Never add any other VITE_ variable, never reference OpenAI in the frontend, never put a key in code. If an environment variable is "missing", do not invent or rename one; report it.
5. All AI happens through ONE Supabase Edge Function called campaign-ai, invoked with supabase.functions.invoke, with exactly three operations: brief_check, generate, revise. Never call OpenAI directly. Never build a chat interface or an agent loop.
6. Editing is plain form fields, no AI. Every save writes a new plan version through the database functions save_plan_version / update_calendar_item / add_calendar_item / delete_calendar_item / apply_revision (called with supabase.rpc).
7. Every screen has loading, empty and error states with a Retry action. Use accessible markup: labels on inputs, visible focus rings, aria-live for status messages, keyboard-operable everything.
8. Design tokens live in tailwind.config.js (bg, surface, line, ink, accent, state colours; display/h1/h2/h3/body/small/caption type; radius; focus shadow). Use them; do not hardcode new colours.
9. Copy style: short, plain, no marketing jargon. Buttons are verbs ("Build my campaign", "Apply changes", "Discard"). Expand acronyms once (for example "KPIs (key performance indicators)").
10. If a build error appears, fix only that error. If two attempts fail, stop and describe the error instead of refactoring.
```
