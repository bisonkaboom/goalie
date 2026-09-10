-- Goalie schema.
--
-- Core idea: a goal's identity (name, emoji, direction) lives on `goals`, but
-- anything that affects scoring (point value, enabled/disabled) is *effective
-- dated* in `goal_settings`. A day's score resolves each goal to the most
-- recent setting on or before that day, so changing a value today never
-- rewrites yesterday's total. The same pattern applies to `daily_targets`.
--
-- Editing a value twice in one day updates that day's row rather than
-- appending, thanks to the unique (goal_id, effective_on) constraint plus
-- upsert.

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  display_name text,
  avatar_url  text,
  -- Scores are bucketed by local calendar day. Without this, a UTC server
  -- rolls "today" over in the middle of the user's evening.
  time_zone   text not null default 'UTC',
  created_at  timestamptz not null default now()
);

-- Mirror new auth users into public.users so app tables can foreign-key to it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Goals
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_direction') then
    create type public.goal_direction as enum ('do_more', 'do_less');
  end if;
end
$$;

create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  emoji      text not null default '⭐',
  direction  public.goal_direction not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_idx on public.goals (user_id, sort_order, created_at);

-- Effective-dated point value + enabled flag.
create table if not exists public.goal_settings (
  id           uuid primary key default gen_random_uuid(),
  goal_id      uuid not null references public.goals (id) on delete cascade,
  effective_on date not null,
  -- Stored unsigned; `direction` decides which side of the ledger it lands on.
  points       integer not null check (points >= 0),
  is_enabled   boolean not null default true,
  updated_at   timestamptz not null default now(),
  unique (goal_id, effective_on)
);

create index if not exists goal_settings_lookup_idx
  on public.goal_settings (goal_id, effective_on desc);

-- ---------------------------------------------------------------------------
-- Daily target (same effective-dated pattern)
-- ---------------------------------------------------------------------------

create table if not exists public.daily_targets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  effective_on date not null,
  points       integer not null check (points >= 0),
  updated_at   timestamptz not null default now(),
  unique (user_id, effective_on)
);

create index if not exists daily_targets_lookup_idx
  on public.daily_targets (user_id, effective_on desc);

-- ---------------------------------------------------------------------------
-- Tallies
-- ---------------------------------------------------------------------------

create table if not exists public.tallies (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  goal_id    uuid not null references public.goals (id) on delete cascade,
  day        date not null,
  count      integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  unique (goal_id, day)
);

create index if not exists tallies_day_idx on public.tallies (user_id, day);

-- ---------------------------------------------------------------------------
-- Row level security: every table is scoped to the owning user.
-- ---------------------------------------------------------------------------

alter table public.users          enable row level security;
alter table public.goals          enable row level security;
alter table public.goal_settings  enable row level security;
alter table public.daily_targets  enable row level security;
alter table public.tallies        enable row level security;

drop policy if exists users_self on public.users;
create policy users_self on public.users
  for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists goals_own on public.goals;
create policy goals_own on public.goals
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- goal_settings has no user_id; ownership is inherited through the goal.
drop policy if exists goal_settings_own on public.goal_settings;
create policy goal_settings_own on public.goal_settings
  for all
  using (exists (
    select 1 from public.goals g
    where g.id = goal_settings.goal_id and g.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.goals g
    where g.id = goal_settings.goal_id and g.user_id = (select auth.uid())
  ));

drop policy if exists daily_targets_own on public.daily_targets;
create policy daily_targets_own on public.daily_targets
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists tallies_own on public.tallies;
create policy tallies_own on public.tallies
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Scoring
--
-- One query powers both the single-day HOME view and a multi-day chart. For
-- each day in the range it resolves every goal to the setting in force on that
-- day, so a value changed midway through a span is reflected correctly on
-- either side of the change.
-- ---------------------------------------------------------------------------

create or replace function public.day_scores(start_day date, end_day date)
returns table (day date, positive integer, negative integer, target integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with days as (
    select generate_series(start_day, end_day, interval '1 day')::date as day
  ),
  scored as (
    select
      d.day             as day,
      g.direction       as direction,
      t.count * s.points as points
    from days d
    join public.goals g
      on g.user_id = (select auth.uid())
    join public.tallies t
      on t.goal_id = g.id and t.day = d.day
    -- Most recent setting on or before this day.
    join lateral (
      select gs.points, gs.is_enabled
      from public.goal_settings gs
      where gs.goal_id = g.id
        and gs.effective_on <= d.day
      order by gs.effective_on desc
      limit 1
    ) s on s.is_enabled
  )
  select
    d.day,
    coalesce(sum(sc.points) filter (where sc.direction = 'do_more'), 0)::integer as positive,
    coalesce(sum(sc.points) filter (where sc.direction = 'do_less'), 0)::integer as negative,
    coalesce((
      select dt.points
      from public.daily_targets dt
      where dt.user_id = (select auth.uid())
        and dt.effective_on <= d.day
      order by dt.effective_on desc
      limit 1
    ), 0)::integer as target
  from days d
  left join scored sc on sc.day = d.day
  group by d.day
  order by d.day;
$$;
