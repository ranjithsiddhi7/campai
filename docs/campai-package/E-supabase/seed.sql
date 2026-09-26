-- AI note: Demo/seed data for campAI: pricing rows (idempotent), one saved café campaign for the demo user, and sample ledger rows.
-- Owner: Claude Code only (copy to supabase/seed.sql or run in the Supabase SQL Editor after creating the demo user). Bolt must never edit SQL.

-- ============================================================================
-- HOW TO USE
-- ============================================================================
-- 1. Create the demo user first (SQL cannot safely create auth users):
--      Supabase Dashboard -> Authentication -> Users -> "Add user" -> "Create new user"
--      Email: demo@campai.app   Password: choose one and store it in the team password manager
--      Tick "Auto Confirm User".
--    (Or: `supabase auth` is not a CLI command; use the Dashboard, or sign up through the deployed app.)
-- 2. Change the email below if you used a different one.
-- 3. Run this whole file in Supabase Dashboard -> SQL Editor (it runs as the postgres role, which bypasses
--    Row Level Security, so the demo rows are created with the demo user's id).
--    Locally: `supabase db reset` runs supabase/seed.sql automatically after migrations, but the demo user
--    will not exist yet locally, so the DO block below simply reports that and skips the campaign.
-- 4. Safe to re-run: pricing rows upsert; the demo campaign is only created if the demo user has no
--    campaign titled like the café example yet.

-- ============================================================================
-- 1. Pricing (verified 26 September 2026) — same rows as the migration, kept here so a fresh seed is complete
-- ============================================================================
insert into public.ai_model_pricing (model, input_per_million_usd, cached_input_per_million_usd, output_per_million_usd, verified_on, active)
values
  ('gpt-6-sol',  2.00, 0.20, 10.00, '2026-09-26', true),
  ('gpt-6-luna', 0.10, 0.01,  0.50, '2026-09-26', true)
on conflict (model) do update
  set input_per_million_usd        = excluded.input_per_million_usd,
      cached_input_per_million_usd = excluded.cached_input_per_million_usd,
      output_per_million_usd       = excluded.output_per_million_usd,
      verified_on                  = excluded.verified_on,
      active                       = excluded.active;

-- ============================================================================
-- 2. Demo café campaign for the demo user
-- ============================================================================
do $seed$
declare
  v_demo_email text := 'demo@campai.app';   -- <-- change if needed
  v_user_id    uuid;
  v_campaign_id uuid;
  v_version    integer;
  v_plan       jsonb := $plan$
{
  "title": "Weekday Regulars: 4 Weeks to Busier Mornings",
  "executive_summary": "A four-week campaign (5 October to 1 November 2026) to bring more customers into the café on weekdays, built around a simple 'Weekday Regulars' loyalty offer. It targets office workers and remote workers within a ten-minute walk, using the café's Instagram account and small email list plus in-store signage, with S$1,500 split across paid Instagram boosts, offer costs, content and a small contingency. Success is a measurable lift in weekday transactions, tracked from till receipts and promo-code counts.",
  "business_objective": "Increase weekday (Monday to Friday) customer transactions by 20% over the four-week campaign compared with the average of the four weeks before it.",
  "audience": {
    "primary": {
      "name": "Nearby weekday workers",
      "description": "Office and hybrid workers aged 25 to 45 within a ten-minute walk who buy coffee or lunch on workdays and are open to a regular spot that rewards them.",
      "pains": [
        "The same chain coffee every day feels joyless and expensive",
        "Lunch options nearby are crowded between 12 and 1",
        "No time to queue; needs a fast, predictable stop"
      ],
      "motivations": [
        "A small daily treat that feels personal",
        "Being recognised as a regular",
        "Saving money on something they buy anyway"
      ],
      "objections": [
        "Will it be slower than the chain?",
        "Is it worth walking the extra two minutes?"
      ]
    },
    "secondary": {
      "name": "Remote workers and freelancers",
      "description": "People working from home nearby who want a change of scene mid-week, a reliable table and Wi-Fi, and a reason to leave the house.",
      "pains": [
        "Working from home gets isolating",
        "Cafés are noisy or unwelcoming to laptops"
      ],
      "motivations": [
        "A calm place to work for two hours",
        "Feeling part of the neighbourhood"
      ],
      "objections": [
        "Will I be judged for staying with one coffee?"
      ]
    }
  },
  "positioning": {
    "statement": "For people who work nearby and want their weekday coffee to feel like a small reward rather than a transaction, this café is the neighbourhood spot that knows your order and rewards you for coming back, because it is run by people who are there every morning.",
    "differentiators": [
      "Owner-run, so regulars are recognised by name",
      "Faster than the queue at the nearest chain at peak time",
      "A weekday-only offer nobody else on the street runs"
    ]
  },
  "messaging": {
    "core_message": "Make us your weekday habit, and we'll make it worth it.",
    "supporting_messages": [
      "Every fifth weekday coffee is on us.",
      "In and out in under four minutes at 8 a.m.",
      "Lunch that's ready when you are: pre-order by 11.30 and skip the queue."
    ]
  },
  "offer": {
    "name": "Weekday Regulars card",
    "description": "A stamp card valid Monday to Friday: buy four hot drinks, get the fifth free. First-time card holders also get S$1 off any lunch item the same week.",
    "mechanics": "Ask for a card at the counter or show the Instagram post. One stamp per visit, weekdays only. Fifth drink free on the card's fifth weekday visit.",
    "terms": "Weekdays only, one card per person, valid until 30 November 2026. Lunch discount valid in the week the card is issued."
  },
  "strategic_rationale": "The goal is more weekday customers, not more weekend ones, so the whole campaign is time-boxed to Monday to Friday. The people most likely to change their habit are those already within walking distance on workdays, which is why the audience is defined by place and routine rather than demographics. A repeat-visit offer (stamp card) beats a one-off discount because the problem is frequency, not awareness. Instagram is the only owned channel with reach, so it carries the message, while in-store signage and the email list convert people already nearby. The S$1,500 budget is small, so most of it goes to a modest paid Instagram boost aimed at a one-kilometre radius on weekday mornings, when the audience is deciding where to go.",
  "channels": [
    {
      "name": "Instagram (organic and boosted posts)",
      "role": "Reach nearby workers with the offer and daily reasons to visit, boosted within a 1 km radius on weekday mornings.",
      "priority": "primary",
      "budget_share_percent": 55,
      "why": "The café already has an account and audience; geo-targeted boosts are the cheapest way to reach people within walking distance."
    },
    {
      "name": "In-store signage and stamp cards",
      "role": "Convert people already in the café into repeat weekday visitors.",
      "priority": "primary",
      "budget_share_percent": 20,
      "why": "Existing customers are the easiest to bring back one more day a week."
    },
    {
      "name": "Email list",
      "role": "Announce the offer, remind mid-campaign, and share a pre-order lunch link.",
      "priority": "secondary",
      "budget_share_percent": 10,
      "why": "Free to send; the list is small but made of people who already like the café."
    },
    {
      "name": "Google Business Profile",
      "role": "Post the weekday offer so it appears when people search 'café near me' on weekday mornings.",
      "priority": "support",
      "budget_share_percent": 10,
      "why": "Free, and captures people actively looking for a nearby café."
    },
    {
      "name": "Nearby office partnerships",
      "role": "Drop stamp cards and a small poster at two or three nearby offices or co-working spaces.",
      "priority": "support",
      "budget_share_percent": 5,
      "why": "Direct access to the exact audience at near-zero cost."
    }
  ],
  "content_pillars": [
    {
      "name": "The Weekday Deal",
      "description": "Clear, repeated explanations of the Weekday Regulars card and how to use it.",
      "ideas": [
        "Carousel: how the stamp card works in three steps",
        "Reel: 'your fifth coffee is free' with a regular collecting theirs",
        "Story poll: which day do you need a free coffee most?"
      ]
    },
    {
      "name": "Behind the Counter",
      "description": "Faces and routines of the people who run the café, building recognition and warmth.",
      "ideas": [
        "Reel: 6.30 a.m. opening routine",
        "Post: meet the barista who remembers 40 regulars' orders",
        "Story: today's lunch special being made"
      ]
    },
    {
      "name": "Weekday Ritual",
      "description": "Content that frames the café as part of a good workday: speed, calm, a moment to yourself.",
      "ideas": [
        "Reel: 'in and out in four minutes' timed at 8 a.m.",
        "Post: the best quiet table for a mid-week work session",
        "Story: pre-order lunch by 11.30 and skip the queue"
      ]
    },
    {
      "name": "Neighbourhood",
      "description": "The café as part of the local working community.",
      "ideas": [
        "Post: shout-out to a nearby office team who visit every Wednesday",
        "Story: a regular's recommendation in their own words"
      ]
    }
  ],
  "copy": {
    "headline_options": [
      "Your weekday habit, rewarded.",
      "Every fifth weekday coffee is on us.",
      "Four minutes. Great coffee. Back to work.",
      "Make Monday better. Make it a regular thing."
    ],
    "social_captions": [
      "New for weekdays: the Weekday Regulars card. Buy four hot drinks Monday to Friday and the fifth is free. Ask for yours at the counter from Monday 5 October. #WeekdayRegulars",
      "8.02 a.m. Order placed. 8.05 a.m. Out the door with a flat white and a stamp on your card. Weekdays were made for this.",
      "Lunch queue? Not here. Pre-order by 11.30 and it's ready when you arrive. Link in bio.",
      "Meet Sam. Sam remembers your order by day three. Come in on a weekday and test that claim."
    ],
    "email_or_message_copy": [
      {
        "purpose": "Launch announcement to the email list (send Monday 5 October)",
        "subject": "Your fifth weekday coffee is on us",
        "body": "Hi there,\n\nWeekdays just got better. From today, pick up a Weekday Regulars card at the counter: buy four hot drinks Monday to Friday and the fifth is free. First-week card holders also get S$1 off lunch.\n\nNo app, no sign-up, just a stamp each visit.\n\nSee you this week,\nThe team"
      },
      {
        "purpose": "Mid-campaign reminder (send Monday 19 October)",
        "subject": "Halfway to a free coffee?",
        "body": "Hi there,\n\nIf you picked up a Weekday Regulars card, you might be two stamps away from a free drink. If you haven't yet, ask for one this week.\n\nNew this week: pre-order lunch by 11.30 and skip the queue. Reply to this email or message us on Instagram.\n\nThe team"
      }
    ]
  },
  "ad_scripts": [
    {
      "title": "Fifth coffee free (15-second Reel)",
      "channel": "Instagram (organic and boosted posts)",
      "duration_seconds": 15,
      "script": "[0-3s] On screen: 'Monday.' A hand places a cup on the counter. [3-8s] Voice: 'Weekdays are long. Your coffee shouldn't cost more for it.' [8-12s] On screen: stamp card gets its fifth stamp. Voice: 'Buy four weekday coffees. The fifth is free.' [12-15s] On screen: café name, 'Weekday Regulars card, from 5 October'.",
      "visual_notes": "Natural morning light, no music louder than the espresso machine. Shot on a phone. Caption everything for sound-off viewing."
    },
    {
      "title": "Four minutes (20-second Reel)",
      "channel": "Instagram (organic and boosted posts)",
      "duration_seconds": 20,
      "script": "[0-2s] Timer on screen starts at 0:00 as a customer walks in. [2-14s] Quick cuts: order, tap card, drink made, stamp added. [14-18s] Timer stops at 3:52. Voice: 'In and out before your meeting starts.' [18-20s] On screen: 'Weekdays, 7 to 10 a.m.'",
      "visual_notes": "Real customer with permission, single continuous morning. Timer overlay in the top corner throughout."
    }
  ],
  "creative_briefs": [
    {
      "title": "Weekday Regulars stamp card and counter sign",
      "purpose": "Explain the offer in one glance at the point of purchase.",
      "format": "A7 stamp card (both sides) and A5 counter sign",
      "key_message": "Buy four weekday hot drinks, get the fifth free.",
      "visual_direction": "Near-black card with off-white type, five simple circles for stamps, café logo small. Matches the Instagram look.",
      "deliverables": [
        "Print-ready PDF for 500 cards",
        "A5 counter sign PDF",
        "Instagram Story version (1080x1920)"
      ],
      "due_date": "2026-10-02"
    },
    {
      "title": "Launch carousel: how the card works",
      "purpose": "First Instagram post of the campaign; also the boosted post for week one.",
      "format": "Instagram carousel, 3 slides, 1080x1350",
      "key_message": "Three steps: ask for a card, get a stamp each weekday visit, fifth drink free.",
      "visual_direction": "One photo per slide, large numerals 1-2-3, minimal text, consistent off-white on dark.",
      "deliverables": [
        "3 slide images",
        "Caption text",
        "Boost settings: 1 km radius, weekdays 7-10 a.m."
      ],
      "due_date": "2026-10-04"
    }
  ],
  "budget": {
    "currency": "SGD",
    "total": 1500,
    "line_items": [
      {
        "name": "Instagram boosted posts",
        "category": "media",
        "amount": 600,
        "notes": "About S$30 per weekday across 20 weekdays, 1 km radius, 7-10 a.m."
      },
      {
        "name": "Free fifth drinks and lunch discounts",
        "category": "offer",
        "amount": 350,
        "notes": "Covers roughly 70 free drinks at cost plus first-week lunch discounts."
      },
      {
        "name": "Content production",
        "category": "content",
        "amount": 300,
        "notes": "Printing 500 stamp cards and signs, plus a half-day of phone photography and Reels."
      },
      {
        "name": "Tools",
        "category": "tools",
        "amount": 100,
        "notes": "Email tool free tier top-up and a simple pre-order form; promo-code counting is manual."
      },
      {
        "name": "Contingency",
        "category": "contingency",
        "amount": 150,
        "notes": "Held back for week 3 to boost whichever post performs best."
      }
    ]
  },
  "timeline": {
    "start_date": "2026-10-05",
    "end_date": "2026-11-01",
    "phases": [
      {
        "name": "Launch",
        "start_date": "2026-10-05",
        "end_date": "2026-10-11",
        "focus": "Announce the card everywhere; boosted carousel; email launch."
      },
      {
        "name": "Build the habit",
        "start_date": "2026-10-12",
        "end_date": "2026-10-25",
        "focus": "Daily reasons to come in; behind-the-counter content; mid-campaign email; office drops."
      },
      {
        "name": "Close and count",
        "start_date": "2026-10-26",
        "end_date": "2026-11-01",
        "focus": "Last-week push, redeem reminders, measure results and decide whether to keep the card."
      }
    ]
  },
  "kpis": [
    {
      "name": "Weekday transactions",
      "target": "+20% versus the four-week pre-campaign average",
      "how_to_measure": "Count weekday receipts from the till's daily report; compare week by week on a sheet.",
      "cadence": "weekly"
    },
    {
      "name": "Stamp cards issued",
      "target": "200 cards over four weeks",
      "how_to_measure": "Tally sheet at the counter; count remaining cards from the 500 printed.",
      "cadence": "daily"
    },
    {
      "name": "Free drinks redeemed",
      "target": "60 or more by 1 November",
      "how_to_measure": "Staff mark a tally each time a fifth stamp is redeemed.",
      "cadence": "weekly"
    },
    {
      "name": "Instagram reach in the 1 km radius",
      "target": "15,000 accounts reached across boosted posts",
      "how_to_measure": "Instagram Insights on each boosted post, free.",
      "cadence": "weekly"
    },
    {
      "name": "Email open rate",
      "target": "35% or higher on both sends",
      "how_to_measure": "Email tool's built-in report.",
      "cadence": "end_of_campaign"
    }
  ],
  "assumptions": [
    "Currency is Singapore dollars and the market is Singapore.",
    "The campaign starts on the first Monday of next month, 5 October 2026, and runs four weeks.",
    "Existing assets are an Instagram account and a small email list; no website changes are needed.",
    "The café has capacity to serve about 20% more weekday customers without extra staff.",
    "Staff can add a stamp and keep a tally without slowing service."
  ],
  "risks": [
    {
      "risk": "The free-drink cost eats the margin if redemption is higher than expected.",
      "mitigation": "Cap the offer at 500 cards; review redemption weekly; the S$350 line assumes about 70 free drinks."
    },
    {
      "risk": "Boosted posts reach people outside the walkable radius.",
      "mitigation": "Set the boost radius to 1 km and the schedule to weekdays 7-10 a.m.; check the reach map after week one."
    },
    {
      "risk": "Staff forget to offer the card at peak time.",
      "mitigation": "Counter sign plus a card in every takeaway bag in week one."
    }
  ],
  "next_actions": [
    {
      "action": "Print 500 stamp cards and the counter sign.",
      "when": "by Friday 2 October",
      "effort": "small"
    },
    {
      "action": "Shoot the launch carousel and two Reels in one morning.",
      "when": "by Sunday 4 October",
      "effort": "medium"
    },
    {
      "action": "Set up the Instagram boost (1 km, weekdays 7-10 a.m., S$30 per day).",
      "when": "Monday 5 October",
      "effort": "small"
    },
    {
      "action": "Send the launch email and post the Google Business Profile offer.",
      "when": "Monday 5 October",
      "effort": "small"
    },
    {
      "action": "Start the weekly transactions sheet with the last four weeks' till totals.",
      "when": "before launch",
      "effort": "small"
    }
  ],
  "calendar_items": [
    {
      "id": "ci-01",
      "date": "2026-10-05",
      "week_number": 1,
      "channel": "Instagram (organic and boosted posts)",
      "format": "Carousel",
      "objective": "Announce the offer",
      "content_pillar": "The Weekday Deal",
      "title": "How the Weekday Regulars card works",
      "hook": "Your fifth weekday coffee is on us.",
      "body": "New for weekdays: the Weekday Regulars card. Buy four hot drinks Monday to Friday and the fifth is free. Ask for yours at the counter from today. #WeekdayRegulars",
      "cta": "Ask for your card at the counter",
      "creative_direction": "Three slides, large numerals, off-white on dark, one photo each.",
      "ad_script": null,
      "status": "planned",
      "notes": "Boost this post all of week one."
    },
    {
      "id": "ci-02",
      "date": "2026-10-05",
      "week_number": 1,
      "channel": "Email list",
      "format": "Email",
      "objective": "Announce the offer to existing customers",
      "content_pillar": "The Weekday Deal",
      "title": "Launch email",
      "hook": "Your fifth weekday coffee is on us",
      "body": "Weekdays just got better. From today, pick up a Weekday Regulars card at the counter: buy four hot drinks Monday to Friday and the fifth is free. First-week card holders also get S$1 off lunch.",
      "cta": "Come in this week",
      "creative_direction": "Plain text with one photo of the card.",
      "ad_script": null,
      "status": "planned",
      "notes": "Send at 7.30 a.m."
    },
    {
      "id": "ci-03",
      "date": "2026-10-06",
      "week_number": 1,
      "channel": "Google Business Profile",
      "format": "Offer post",
      "objective": "Capture 'café near me' searches",
      "content_pillar": "The Weekday Deal",
      "title": "Weekday Regulars offer post",
      "hook": "Every fifth weekday coffee free",
      "body": "Weekday Regulars card: buy four hot drinks Mon-Fri, get the fifth free. Valid until 30 November.",
      "cta": "Visit weekdays 7 a.m. to 4 p.m.",
      "creative_direction": "Photo of the card on the counter.",
      "ad_script": null,
      "status": "planned",
      "notes": "Set the offer end date to 30 November."
    },
    {
      "id": "ci-04",
      "date": "2026-10-07",
      "week_number": 1,
      "channel": "Instagram (organic and boosted posts)",
      "format": "Reel",
      "objective": "Show the offer in action",
      "content_pillar": "The Weekday Deal",
      "title": "Fifth coffee free",
      "hook": "Weekdays are long. Your coffee shouldn't cost more for it.",
      "body": "Buy four weekday coffees. The fifth is free. Weekday Regulars card at the counter now.",
      "cta": "Save this for Monday",
      "creative_direction": "Natural light, phone-shot, captions on.",
      "ad_script": "[0-3s] On screen: 'Monday.' A hand places a cup on the counter. [3-8s] Voice: 'Weekdays are long. Your coffee shouldn't cost more for it.' [8-12s] On screen: stamp card gets its fifth stamp. Voice: 'Buy four weekday coffees. The fifth is free.' [12-15s] On screen: café name, 'Weekday Regulars card, from 5 October'.",
      "status": "planned",
      "notes": ""
    },
    {
      "id": "ci-05",
      "date": "2026-10-09",
      "week_number": 1,
      "channel": "Nearby office partnerships",
      "format": "Poster and card drop",
      "objective": "Reach office workers directly",
      "content_pillar": "Neighbourhood",
      "title": "Office drop: two nearby buildings",
      "hook": "A free coffee for the team, five days at a time.",
      "body": "Drop 50 stamp cards and an A5 poster at reception or the pantry of two nearby offices or co-working spaces.",
      "cta": "Show the card at the counter",
      "creative_direction": "Same design as the counter sign.",
      "ad_script": null,
      "status": "planned",
      "notes": "Ask permission at reception first."
    },
    {
      "id": "ci-06",
      "date": "2026-10-13",
      "week_number": 2,
      "channel": "Instagram (organic and boosted posts)",
      "format": "Reel",
      "objective": "Answer the 'is it slow?' objection",
      "content_pillar": "Weekday Ritual",
      "title": "Four minutes",
      "hook": "In and out before your meeting starts.",
      "body": "8.02 a.m. Order placed. 8.05 a.m. Out the door with a flat white and a stamp on your card. Weekdays were made for this.",
      "cta": "See you at 8",
      "creative_direction": "Timer overlay, single morning, real customer with permission.",
      "ad_script": "[0-2s] Timer on screen starts at 0:00 as a customer walks in. [2-14s] Quick cuts: order, tap card, drink made, stamp added. [14-18s] Timer stops at 3:52. Voice: 'In and out before your meeting starts.' [18-20s] On screen: 'Weekdays, 7 to 10 a.m.'",
      "status": "planned",
      "notes": "Boost in week two."
    },
    {
      "id": "ci-07",
      "date": "2026-10-15",
      "week_number": 2,
      "channel": "Instagram (organic and boosted posts)",
      "format": "Post",
      "objective": "Build recognition and warmth",
      "content_pillar": "Behind the Counter",
      "title": "Meet Sam",
      "hook": "Sam remembers your order by day three.",
      "body": "Meet Sam. Sam remembers your order by day three. Come in on a weekday and test that claim.",
      "cta": "Come say hi this week",
      "creative_direction": "Portrait behind the machine, warm morning light.",
      "ad_script": null,
      "status": "planned",
      "notes": ""
    },
    {
      "id": "ci-08",
      "date": "2026-10-16",
      "week_number": 2,
      "channel": "Instagram (organic and boosted posts)",
      "format": "Story",
      "objective": "Drive engagement and remind about the card",
      "content_pillar": "The Weekday Deal",
      "title": "Which day needs a free coffee most?",
      "hook": "Poll: Monday or Thursday?",
      "body": "Which weekday needs a free coffee most? Vote, then come collect a stamp.",
      "cta": "Vote now",
      "creative_direction": "Poll sticker over a photo of the stamp card.",
      "ad_script": null,
      "status": "planned",
      "notes": ""
    },
    {
      "id": "ci-09",
      "date": "2026-10-19",
      "week_number": 3,
      "channel": "Email list",
      "format": "Email",
      "objective": "Mid-campaign reminder and pre-order push",
      "content_pillar": "Weekday Ritual",
      "title": "Halfway to a free coffee?",
      "hook": "You might be two stamps away.",
      "body": "If you picked up a Weekday Regulars card, you might be two stamps away from a free drink. New this week: pre-order lunch by 11.30 and skip the queue.",
      "cta": "Pre-order lunch",
      "creative_direction": "Plain text, one lunch photo.",
      "ad_script": null,
      "status": "planned",
      "notes": "Send at 7.30 a.m."
    },
    {
      "id": "ci-10",
      "date": "2026-10-21",
      "week_number": 3,
      "channel": "Instagram (organic and boosted posts)",
      "format": "Reel",
      "objective": "Promote lunch pre-orders",
      "content_pillar": "Weekday Ritual",
      "title": "Skip the lunch queue",
      "hook": "Lunch queue? Not here.",
      "body": "Pre-order by 11.30 and it's ready when you arrive. Link in bio.",
      "cta": "Pre-order via link in bio",
      "creative_direction": "Lunch being packed, name written on the bag, handed over.",
      "ad_script": null,
      "status": "planned",
      "notes": "Use contingency budget to boost this if week-two Reel performed well."
    },
    {
      "id": "ci-11",
      "date": "2026-10-23",
      "week_number": 3,
      "channel": "Instagram (organic and boosted posts)",
      "format": "Post",
      "objective": "Social proof from regulars",
      "content_pillar": "Neighbourhood",
      "title": "The Wednesday team",
      "hook": "Every Wednesday, same table, same order.",
      "body": "Shout-out to the team from down the road who make Wednesday our favourite day. Tag your weekday coffee crew.",
      "cta": "Tag your crew",
      "creative_direction": "Photo of a group at their usual table, with permission.",
      "ad_script": null,
      "status": "planned",
      "notes": ""
    },
    {
      "id": "ci-12",
      "date": "2026-10-28",
      "week_number": 4,
      "channel": "In-store signage and stamp cards",
      "format": "Counter sign update",
      "objective": "Prompt final redemptions",
      "content_pillar": "The Weekday Deal",
      "title": "Last week to fill your card",
      "hook": "Three stamps down? Finish the week strong.",
      "body": "Update the counter sign: 'Weekday Regulars cards are valid until 30 November, but this week we'll add a bonus stamp to any card with three or more.'",
      "cta": "Show your card",
      "creative_direction": "Handwritten add-on to the A5 sign.",
      "ad_script": null,
      "status": "planned",
      "notes": "Also post as a Story the same morning."
    }
  ]
}
$plan$::jsonb;
begin
  select id into v_user_id from auth.users where email = v_demo_email limit 1;

  if v_user_id is null then
    raise notice 'campAI seed: demo user % not found. Create it in Authentication -> Users, then re-run this file.', v_demo_email;
    return;
  end if;

  -- Make sure the profile exists even if the user was created before the trigger.
  insert into public.profiles (id, email, display_name)
  values (v_user_id, v_demo_email, 'Demo café owner')
  on conflict (id) do nothing;

  if exists (select 1 from public.campaigns where user_id = v_user_id and title = v_plan ->> 'title') then
    raise notice 'campAI seed: demo campaign already exists for %, skipping.', v_demo_email;
    return;
  end if;

  insert into public.campaigns (user_id, title, status)
  values (v_user_id, v_plan ->> 'title', 'draft')
  returning id into v_campaign_id;

  insert into public.campaign_briefs (
    campaign_id, user_id, business, product_or_service, goal, audience_clues,
    budget_amount, currency, market, start_date, duration_weeks, end_date,
    existing_assets, tone_and_constraints, brief_check
  ) values (
    v_campaign_id, v_user_id,
    'A small independent café',
    'Coffee, drinks and café food',
    'More customers during weekdays',
    'People who work or live within walking distance on weekdays',
    1500, 'SGD', 'Singapore', date '2026-10-05', 4, date '2026-11-01',
    'An Instagram account and a small email list',
    'Friendly and down to earth. Nothing to avoid.',
    jsonb_build_object(
      'used_ai', true,
      'free_text', 'I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month.',
      'result', null,
      'answered_fields', jsonb_build_array('product_or_service','audience_clues','market','schedule','existing_assets','tone_and_constraints'),
      'field_statuses', jsonb_build_object(
        'goal','stated','business','stated','product_or_service','inferred','audience_clues','missing',
        'budget','stated','market','inferred','schedule','inferred','existing_assets','missing','tone_and_constraints','missing')
    )
  );

  -- Saves version 1, rebuilds calendar_items, sets status 'ready' and the title.
  v_version := public.save_plan_version(v_campaign_id, v_plan, 'generated', '[]'::jsonb);

  -- Sample ledger rows so the Settings usage summary has something to show in the demo.
  insert into public.ai_usage_events (user_id, campaign_id, operation, request_id, model, input_tokens, cached_input_tokens, output_tokens, total_tokens, estimated_cost_usd, status, latency_ms, created_at)
  values
    (v_user_id, v_campaign_id, 'brief_check', gen_random_uuid(), 'gpt-6-luna', 780, 0, 420, 1200, 0.000288, 'success', 4200, now() - interval '2 hours'),
    (v_user_id, v_campaign_id, 'generate',    gen_random_uuid(), 'gpt-6-sol', 1850, 0, 7400, 9250, 0.077700, 'success', 46000, now() - interval '2 hours' + interval '1 minute');

  raise notice 'campAI seed: created demo campaign % (plan version %) for %', v_campaign_id, v_version, v_demo_email;
end
$seed$;
