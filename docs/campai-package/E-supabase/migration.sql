-- AI note: Complete, executable Supabase (Postgres) migration for campAI: tables, constraints, indexes, triggers, helper functions, Row Level Security.
-- Owner: Claude Code only (copy to supabase/migrations/20260926000000_campai_init.sql). Bolt must never edit SQL. Apply with `supabase db push`.

-- ============================================================================
-- 0. Extensions and conventions
-- ============================================================================
-- gen_random_uuid() is built into Postgres 13+; pgcrypto is present on Supabase anyway.
create extension if not exists pgcrypto;

-- ============================================================================
-- 1. Helper: updated_at trigger
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 2. profiles — one row per auth user, created by trigger on auth.users
-- ============================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 3. ai_model_pricing — prices per 1M tokens, verified date, active flag
-- ============================================================================
create table if not exists public.ai_model_pricing (
  model                         text primary key,
  input_per_million_usd         numeric(10, 4) not null check (input_per_million_usd >= 0),
  cached_input_per_million_usd  numeric(10, 4) not null check (cached_input_per_million_usd >= 0),
  output_per_million_usd        numeric(10, 4) not null check (output_per_million_usd >= 0),
  verified_on                   date not null,
  active                        boolean not null default true
);

-- ============================================================================
-- 4. campaigns
-- ============================================================================
create table if not exists public.campaigns (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title                text not null default 'Untitled campaign' check (char_length(title) between 1 and 120),
  status               text not null default 'draft' check (status in ('draft', 'generating', 'ready', 'error')),
  current_plan_version integer not null default 0 check (current_plan_version >= 0),
  last_error           text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists campaigns_user_updated_idx on public.campaigns (user_id, updated_at desc);

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 5. campaign_briefs — one per campaign; typed inputs + brief_check JSONB
-- ============================================================================
create table if not exists public.campaign_briefs (
  id                   uuid primary key default gen_random_uuid(),
  campaign_id          uuid not null unique references public.campaigns (id) on delete cascade,
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  business             text not null check (char_length(business) between 1 and 500),
  product_or_service   text not null check (char_length(product_or_service) between 1 and 500),
  goal                 text not null check (char_length(goal) between 1 and 500),
  audience_clues       text not null check (char_length(audience_clues) between 1 and 1000),
  budget_amount        numeric(12, 2) not null check (budget_amount > 0),
  currency             char(3) not null check (currency ~ '^[A-Z]{3}$'),
  market               text not null check (char_length(market) between 1 and 200),
  start_date           date not null,
  duration_weeks       integer not null check (duration_weeks between 1 and 12),
  end_date             date not null,
  existing_assets      text not null check (char_length(existing_assets) between 1 and 1000),
  tone_and_constraints text check (tone_and_constraints is null or char_length(tone_and_constraints) <= 1000),
  brief_check          jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint campaign_briefs_dates_chk check (end_date >= start_date),
  constraint campaign_briefs_end_date_chk check (end_date = start_date + (duration_weeks * 7 - 1))
);

create index if not exists campaign_briefs_user_idx on public.campaign_briefs (user_id);

create trigger campaign_briefs_set_updated_at
  before update on public.campaign_briefs
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 6. campaign_plans — versioned JSONB snapshots; latest version = working copy
-- ============================================================================
create table if not exists public.campaign_plans (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  version     integer not null check (version >= 1),
  source      text not null check (source in ('generated', 'edited', 'revised')),
  plan        jsonb not null,
  flags       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  constraint campaign_plans_version_uq unique (campaign_id, version),
  constraint campaign_plans_plan_is_object check (jsonb_typeof(plan) = 'object'),
  constraint campaign_plans_flags_is_array check (jsonb_typeof(flags) = 'array')
);

create index if not exists campaign_plans_campaign_version_idx on public.campaign_plans (campaign_id, version desc);
create index if not exists campaign_plans_user_idx on public.campaign_plans (user_id);

-- ============================================================================
-- 7. calendar_items — normalised rows, rebuilt from the plan on every save
-- ============================================================================
create table if not exists public.calendar_items (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid not null references public.campaigns (id) on delete cascade,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date               date not null,
  week_number        integer not null check (week_number >= 1),
  channel            text not null,
  format             text not null,
  objective          text not null,
  content_pillar     text not null,
  title              text not null,
  hook               text not null,
  body               text not null,
  cta                text not null,
  creative_direction text not null,
  ad_script          text,
  status             text not null default 'planned' check (status in ('planned', 'in_progress', 'done', 'skipped')),
  notes              text not null default '',
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists calendar_items_campaign_date_idx on public.calendar_items (campaign_id, date, sort_order);
create index if not exists calendar_items_user_idx on public.calendar_items (user_id);

create trigger calendar_items_set_updated_at
  before update on public.calendar_items
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 8. campaign_revisions — proposed / applied / discarded
-- ============================================================================
create table if not exists public.campaign_revisions (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references public.campaigns (id) on delete cascade,
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  request_id          uuid not null unique,
  instruction         text not null check (char_length(instruction) between 3 and 500),
  locked_sections     jsonb not null default '[]'::jsonb check (jsonb_typeof(locked_sections) = 'array'),
  changed_sections    jsonb not null default '[]'::jsonb check (jsonb_typeof(changed_sections) = 'array'),
  change_summary      text not null default '',
  before_plan_version integer not null check (before_plan_version >= 1),
  after_plan_version  integer check (after_plan_version is null or after_plan_version > before_plan_version),
  proposed_plan       jsonb not null check (jsonb_typeof(proposed_plan) = 'object'),
  status              text not null default 'proposed' check (status in ('proposed', 'applied', 'discarded')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists campaign_revisions_campaign_idx on public.campaign_revisions (campaign_id, created_at desc);
create index if not exists campaign_revisions_user_idx on public.campaign_revisions (user_id);

create trigger campaign_revisions_set_updated_at
  before update on public.campaign_revisions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 9. ai_usage_events — the ledger (one row per attempt, including failures)
-- ============================================================================
create table if not exists public.ai_usage_events (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  campaign_id         uuid references public.campaigns (id) on delete set null,
  operation           text not null check (operation in ('brief_check', 'generate', 'revise')),
  request_id          uuid not null unique,
  model               text,
  input_tokens        integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens >= 0),
  output_tokens       integer not null default 0 check (output_tokens >= 0),
  total_tokens        integer not null default 0 check (total_tokens >= 0),
  estimated_cost_usd  numeric(12, 6) not null default 0 check (estimated_cost_usd >= 0),
  currency            char(3) not null default 'USD' check (currency = 'USD'),
  status              text not null check (status in (
                        'success', 'invalid_request', 'refused', 'incomplete', 'schema_invalid',
                        'timeout', 'rate_limited', 'upstream_error', 'internal_error', 'daily_limit_reached')),
  error_code          text,
  latency_ms          integer check (latency_ms is null or latency_ms >= 0),
  response            jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists ai_usage_events_user_created_idx on public.ai_usage_events (user_id, created_at desc);
create index if not exists ai_usage_events_campaign_idx on public.ai_usage_events (campaign_id);

-- ============================================================================
-- 10. Helper functions
-- ============================================================================

-- 10.1 Count today's (UTC) AI calls for a user. Used by the Edge Function (admin client)
--      for the daily cap and by the Settings page (own user only).
create or replace function public.count_user_ai_calls_today(p_user_id uuid default auth.uid())
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.ai_usage_events
  where user_id = p_user_id
    and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    and (p_user_id = auth.uid() or auth.role() = 'service_role');
$$;

-- 10.2 Rebuild calendar_items from a plan's calendar_items array (internal).
create or replace function public.rebuild_calendar_items(p_campaign_id uuid, p_user_id uuid, p_plan jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.calendar_items where campaign_id = p_campaign_id;

  insert into public.calendar_items (
    id, campaign_id, user_id, date, week_number, channel, format, objective, content_pillar,
    title, hook, body, cta, creative_direction, ad_script, status, notes, sort_order
  )
  select
    case
      when (item ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (item ->> 'id')::uuid
      else gen_random_uuid()
    end,
    p_campaign_id,
    p_user_id,
    (item ->> 'date')::date,
    coalesce((item ->> 'week_number')::integer, 1),
    coalesce(item ->> 'channel', ''),
    coalesce(item ->> 'format', ''),
    coalesce(item ->> 'objective', ''),
    coalesce(item ->> 'content_pillar', ''),
    coalesce(item ->> 'title', ''),
    coalesce(item ->> 'hook', ''),
    coalesce(item ->> 'body', ''),
    coalesce(item ->> 'cta', ''),
    coalesce(item ->> 'creative_direction', ''),
    item ->> 'ad_script',
    case when item ->> 'status' in ('planned', 'in_progress', 'done', 'skipped') then item ->> 'status' else 'planned' end,
    coalesce(item ->> 'notes', ''),
    ord::integer
  from jsonb_array_elements(coalesce(p_plan -> 'calendar_items', '[]'::jsonb)) with ordinality as t(item, ord);
end;
$$;

-- 10.3 Save a new plan version (working copy), rebuild calendar rows, bump the campaign.
--      Runs as the caller; RLS proves ownership. Returns the new version number.
create or replace function public.save_plan_version(
  p_campaign_id uuid,
  p_plan        jsonb,
  p_source      text,
  p_flags       jsonb default '[]'::jsonb
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
  v_version integer;
  v_title   text;
begin
  if p_source not in ('generated', 'edited', 'revised') then
    raise exception 'invalid source %', p_source using errcode = '22023';
  end if;
  if jsonb_typeof(p_plan) <> 'object' then
    raise exception 'plan must be a JSON object' using errcode = '22023';
  end if;

  -- Lock the campaign row; a miss (RLS or wrong id) raises not found.
  select user_id into v_user_id
  from public.campaigns
  where id = p_campaign_id
  for update;

  if v_user_id is null then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;

  select coalesce(max(version), 0) + 1 into v_version
  from public.campaign_plans
  where campaign_id = p_campaign_id;

  -- Give every calendar item a UUID id inside the plan JSON, so plan items and calendar_items rows share ids.
  select jsonb_set(
           p_plan,
           '{calendar_items}',
           coalesce((
             select jsonb_agg(
               case
                 when (item ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then item
                 else item || jsonb_build_object('id', gen_random_uuid()::text)
               end
               order by ord)
             from jsonb_array_elements(coalesce(p_plan -> 'calendar_items', '[]'::jsonb)) with ordinality as t(item, ord)
           ), '[]'::jsonb),
           true)
  into p_plan;

  insert into public.campaign_plans (campaign_id, user_id, version, source, plan, flags)
  values (p_campaign_id, v_user_id, v_version, p_source, p_plan, coalesce(p_flags, '[]'::jsonb));

  perform public.rebuild_calendar_items(p_campaign_id, v_user_id, p_plan);

  v_title := nullif(left(p_plan ->> 'title', 120), '');

  update public.campaigns
  set current_plan_version = v_version,
      status = 'ready',
      last_error = null,
      title = coalesce(v_title, title)
  where id = p_campaign_id;

  return v_version;
end;
$$;

-- 10.4 Edit one calendar item: patch the row's fields inside the latest plan JSON and save a new version.
--      p_patch may contain any of: date, week_number, channel, format, objective, content_pillar, title,
--      hook, body, cta, creative_direction, ad_script, status, notes.
create or replace function public.update_calendar_item(p_item_id uuid, p_patch jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_campaign_id uuid;
  v_plan        jsonb;
  v_items       jsonb;
  v_new_items   jsonb := '[]'::jsonb;
  v_item        jsonb;
  v_allowed     text[] := array['date','week_number','channel','format','objective','content_pillar','title',
                                'hook','body','cta','creative_direction','ad_script','status','notes'];
  v_clean       jsonb := '{}'::jsonb;
  v_key         text;
  v_found       boolean := false;
begin
  select campaign_id into v_campaign_id from public.calendar_items where id = p_item_id;
  if v_campaign_id is null then
    raise exception 'calendar item not found' using errcode = 'P0002';
  end if;

  foreach v_key in array v_allowed loop
    if p_patch ? v_key then
      v_clean := v_clean || jsonb_build_object(v_key, p_patch -> v_key);
    end if;
  end loop;

  select plan into v_plan
  from public.campaign_plans
  where campaign_id = v_campaign_id
  order by version desc
  limit 1;

  if v_plan is null then
    raise exception 'plan not found' using errcode = 'P0002';
  end if;

  v_items := coalesce(v_plan -> 'calendar_items', '[]'::jsonb);

  for v_item in select value from jsonb_array_elements(v_items) loop
    if v_item ->> 'id' = p_item_id::text then
      v_new_items := v_new_items || (v_item || v_clean);
      v_found := true;
    else
      v_new_items := v_new_items || v_item;
    end if;
  end loop;

  if not v_found then
    -- save_plan_version guarantees plan ids and row ids match, so this indicates corrupted data.
    raise exception 'calendar item % is not in the current plan' , p_item_id using errcode = 'P0002';
  end if;

  v_plan := jsonb_set(v_plan, '{calendar_items}', v_new_items, true);

  return public.save_plan_version(v_campaign_id, v_plan, 'edited', '[]'::jsonb);
end;
$$;

-- 10.5 Delete one calendar item (from the plan and the rows) and save a new version.
create or replace function public.delete_calendar_item(p_item_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_campaign_id uuid;
  v_plan        jsonb;
  v_new_items   jsonb;
begin
  select campaign_id into v_campaign_id from public.calendar_items where id = p_item_id;
  if v_campaign_id is null then
    raise exception 'calendar item not found' using errcode = 'P0002';
  end if;

  select plan into v_plan
  from public.campaign_plans
  where campaign_id = v_campaign_id
  order by version desc
  limit 1;

  select coalesce(jsonb_agg(value), '[]'::jsonb) into v_new_items
  from jsonb_array_elements(coalesce(v_plan -> 'calendar_items', '[]'::jsonb))
  where value ->> 'id' <> p_item_id::text;

  v_plan := jsonb_set(v_plan, '{calendar_items}', v_new_items, true);

  return public.save_plan_version(v_campaign_id, v_plan, 'edited', '[]'::jsonb);
end;
$$;

-- 10.6 Add one calendar item (p_item is a full CalendarItem object without id) and save a new version.
create or replace function public.add_calendar_item(p_campaign_id uuid, p_item jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_plan    jsonb;
  v_id      uuid := gen_random_uuid();
  v_item    jsonb;
begin
  select plan into v_plan
  from public.campaign_plans
  where campaign_id = p_campaign_id
  order by version desc
  limit 1;

  if v_plan is null then
    raise exception 'plan not found' using errcode = 'P0002';
  end if;

  v_item := jsonb_build_object(
    'id', v_id::text,
    'date', coalesce(p_item ->> 'date', (v_plan #>> '{timeline,start_date}')),
    'week_number', coalesce((p_item ->> 'week_number')::integer, 1),
    'channel', coalesce(p_item ->> 'channel', ''),
    'format', coalesce(p_item ->> 'format', 'Post'),
    'objective', coalesce(p_item ->> 'objective', ''),
    'content_pillar', coalesce(p_item ->> 'content_pillar', ''),
    'title', coalesce(p_item ->> 'title', 'New item'),
    'hook', coalesce(p_item ->> 'hook', ''),
    'body', coalesce(p_item ->> 'body', ''),
    'cta', coalesce(p_item ->> 'cta', ''),
    'creative_direction', coalesce(p_item ->> 'creative_direction', ''),
    'ad_script', p_item -> 'ad_script',
    'status', case when p_item ->> 'status' in ('planned','in_progress','done','skipped') then p_item ->> 'status' else 'planned' end,
    'notes', coalesce(p_item ->> 'notes', '')
  );
  if v_item -> 'ad_script' is null then
    v_item := v_item || jsonb_build_object('ad_script', null);
  end if;

  v_plan := jsonb_set(v_plan, '{calendar_items}', coalesce(v_plan -> 'calendar_items', '[]'::jsonb) || v_item, true);

  perform public.save_plan_version(p_campaign_id, v_plan, 'edited', '[]'::jsonb);
  return v_id;
end;
$$;

-- 10.7 Apply a proposed revision: new plan version (source 'revised'), rebuild rows, mark applied. One transaction.
create or replace function public.apply_revision(p_revision_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_rev     public.campaign_revisions%rowtype;
  v_version integer;
begin
  select * into v_rev
  from public.campaign_revisions
  where id = p_revision_id
  for update;

  if v_rev.id is null then
    raise exception 'revision not found' using errcode = 'P0002';
  end if;
  if v_rev.status <> 'proposed' then
    raise exception 'revision already %', v_rev.status using errcode = '22023';
  end if;

  v_version := public.save_plan_version(v_rev.campaign_id, v_rev.proposed_plan, 'revised', '[]'::jsonb);

  update public.campaign_revisions
  set status = 'applied',
      after_plan_version = v_version
  where id = p_revision_id;

  return v_version;
end;
$$;

-- 10.8 Settings page summary for the signed-in user.
create or replace function public.my_ai_usage_summary()
returns table (
  total_calls        bigint,
  successful_calls   bigint,
  failed_calls       bigint,
  calls_today        bigint,
  input_tokens       bigint,
  cached_input_tokens bigint,
  output_tokens      bigint,
  total_tokens       bigint,
  estimated_cost_usd numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)                                                         as total_calls,
    count(*) filter (where status = 'success')                       as successful_calls,
    count(*) filter (where status <> 'success')                      as failed_calls,
    count(*) filter (where created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc') as calls_today,
    coalesce(sum(input_tokens), 0)::bigint                           as input_tokens,
    coalesce(sum(cached_input_tokens), 0)::bigint                    as cached_input_tokens,
    coalesce(sum(output_tokens), 0)::bigint                          as output_tokens,
    coalesce(sum(total_tokens), 0)::bigint                           as total_tokens,
    coalesce(sum(estimated_cost_usd), 0)::numeric(12, 6)             as estimated_cost_usd
  from public.ai_usage_events
  where user_id = auth.uid();
$$;

-- ============================================================================
-- 11. Row Level Security
-- ============================================================================
alter table public.profiles           enable row level security;
alter table public.campaigns          enable row level security;
alter table public.campaign_briefs    enable row level security;
alter table public.campaign_plans     enable row level security;
alter table public.calendar_items     enable row level security;
alter table public.campaign_revisions enable row level security;
alter table public.ai_usage_events    enable row level security;
alter table public.ai_model_pricing   enable row level security;

-- profiles: read and update own row only (insert is done by the trigger)
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- campaigns: full CRUD on own rows
create policy "campaigns_select_own" on public.campaigns
  for select to authenticated using (user_id = auth.uid());
create policy "campaigns_insert_own" on public.campaigns
  for insert to authenticated with check (user_id = auth.uid());
create policy "campaigns_update_own" on public.campaigns
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "campaigns_delete_own" on public.campaigns
  for delete to authenticated using (user_id = auth.uid());

-- campaign_briefs
create policy "campaign_briefs_select_own" on public.campaign_briefs
  for select to authenticated using (user_id = auth.uid());
create policy "campaign_briefs_insert_own" on public.campaign_briefs
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid())
  );
create policy "campaign_briefs_update_own" on public.campaign_briefs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "campaign_briefs_delete_own" on public.campaign_briefs
  for delete to authenticated using (user_id = auth.uid());

-- campaign_plans: versions are immutable; insert and read, delete only via campaign cascade
create policy "campaign_plans_select_own" on public.campaign_plans
  for select to authenticated using (user_id = auth.uid());
create policy "campaign_plans_insert_own" on public.campaign_plans
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid())
  );

-- calendar_items: full CRUD on own rows (the helper functions also run under these policies)
create policy "calendar_items_select_own" on public.calendar_items
  for select to authenticated using (user_id = auth.uid());
create policy "calendar_items_insert_own" on public.calendar_items
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid())
  );
create policy "calendar_items_update_own" on public.calendar_items
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "calendar_items_delete_own" on public.calendar_items
  for delete to authenticated using (user_id = auth.uid());

-- campaign_revisions: read own; insert own (the Edge Function inserts through the user client);
-- update own (status changes only in practice); delete via cascade
create policy "campaign_revisions_select_own" on public.campaign_revisions
  for select to authenticated using (user_id = auth.uid());
create policy "campaign_revisions_insert_own" on public.campaign_revisions
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid())
  );
create policy "campaign_revisions_update_own" on public.campaign_revisions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ai_usage_events: users may read their own rows only. No insert/update/delete policies:
-- only the Edge Function's secret-key (service role) client writes the ledger, and it bypasses RLS.
create policy "ai_usage_events_select_own" on public.ai_usage_events
  for select to authenticated using (user_id = auth.uid());

-- ai_model_pricing: readable by signed-in users; writable only by the service role (no policy = no access)
create policy "ai_model_pricing_select_authenticated" on public.ai_model_pricing
  for select to authenticated using (true);

-- ============================================================================
-- 12. Grants (Supabase default roles)
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.campaign_briefs to authenticated;
grant select, insert on public.campaign_plans to authenticated;
grant select, insert, update, delete on public.calendar_items to authenticated;
grant select, insert, update on public.campaign_revisions to authenticated;
grant select on public.ai_usage_events to authenticated;
grant select on public.ai_model_pricing to authenticated;

grant all on all tables in schema public to service_role;

revoke all on public.profiles, public.campaigns, public.campaign_briefs, public.campaign_plans,
  public.calendar_items, public.campaign_revisions, public.ai_usage_events, public.ai_model_pricing from anon;

grant execute on function public.count_user_ai_calls_today(uuid) to authenticated, service_role;
grant execute on function public.save_plan_version(uuid, jsonb, text, jsonb) to authenticated, service_role;
grant execute on function public.update_calendar_item(uuid, jsonb) to authenticated;
grant execute on function public.delete_calendar_item(uuid) to authenticated;
grant execute on function public.add_calendar_item(uuid, jsonb) to authenticated;
grant execute on function public.apply_revision(uuid) to authenticated;
grant execute on function public.my_ai_usage_summary() to authenticated;
-- rebuild_calendar_items is internal but security invoker, so the calling role needs execute.
revoke execute on function public.rebuild_calendar_items(uuid, uuid, jsonb) from public, anon;
grant execute on function public.rebuild_calendar_items(uuid, uuid, jsonb) to authenticated, service_role;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ============================================================================
-- 13. Pricing seed (verified 26 September 2026). Safe to re-run.
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
