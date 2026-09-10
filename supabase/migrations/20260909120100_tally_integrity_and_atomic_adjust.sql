-- Fixes three defects in 0001 and adds the atomic tally primitive.
--
-- 1. `tallies.user_id` was free to disagree with `goals.user_id`. The RLS policy
--    on tallies keys off user_id alone, so a mis-attributed row was visible to
--    the wrong account. A composite foreign key makes the invariant structural.
-- 2. Incrementing a tally was a read-then-write in the app layer, so two fast
--    taps both read N and both wrote N+1. `adjust_tally` does it in one
--    statement, which Postgres serialises via the ON CONFLICT row lock.
-- 3. `emoji` and `time_zone` were unbounded text on columns written from public
--    Server Action endpoints.
--
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Tally ownership
-- ---------------------------------------------------------------------------

-- Repair any drifted rows before the constraint starts enforcing the invariant.
update public.tallies t
set user_id = g.user_id
from public.goals g
where g.id = t.goal_id
  and t.user_id is distinct from g.user_id;

-- A composite FK needs a matching unique key on the referenced side. `id` is
-- already the primary key, so (id, user_id) is trivially unique.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.goals'::regclass and conname = 'goals_id_user_key'
  ) then
    alter table public.goals add constraint goals_id_user_key unique (id, user_id);
  end if;
end
$$;

-- The single-column FK is redundant once the composite one exists, and leaving
-- both gives two cascade paths for the same delete.
alter table public.tallies drop constraint if exists tallies_goal_id_fkey;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tallies'::regclass and conname = 'tallies_goal_user_fkey'
  ) then
    alter table public.tallies
      add constraint tallies_goal_user_fkey
      foreign key (goal_id, user_id) references public.goals (id, user_id)
      on delete cascade on update cascade;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Bounds on columns fed by public Server Action endpoints
-- ---------------------------------------------------------------------------

-- 16 code points, not 1: a ZWJ family emoji is 7, and flag sequences plus
-- skin-tone modifiers push higher. Grapheme-level truncation happens in TS.
alter table public.goals drop constraint if exists goals_emoji_len_check;
alter table public.goals add constraint goals_emoji_len_check
  check (char_length(emoji) between 1 and 16);

-- pg_timezone_names is a view and not IMMUTABLE, so it cannot appear in a
-- CHECK. Real IANA validation lives in setTimeZone(); this is only a bound.
alter table public.users drop constraint if exists users_time_zone_check;
alter table public.users add constraint users_time_zone_check
  check (char_length(time_zone) between 1 and 64);

-- ---------------------------------------------------------------------------
-- 3. Atomic tally adjustment
-- ---------------------------------------------------------------------------

create or replace function public.adjust_tally(
  p_goal_id uuid,
  p_day     date,
  p_delta   integer
)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_owner uuid;
  v_next  integer;
begin
  -- Derive the owner from the goal rather than trusting a caller-supplied id.
  -- security invoker means RLS applies, so this finds nothing for a goal the
  -- caller does not own.
  select g.user_id into v_owner
  from public.goals g
  where g.id = p_goal_id;

  if v_owner is null then
    raise exception 'goal % not found', p_goal_id;
  end if;

  -- One statement. On conflict Postgres takes a row lock, so a concurrent call
  -- blocks and then increments the committed value rather than a stale read.
  --
  -- The `as t` alias is required: `set search_path = ''` forbids writing
  -- `public.tallies.count` in the DO UPDATE SET, and a bare `count` is
  -- ambiguous with the aggregate of the same name.
  insert into public.tallies as t (user_id, goal_id, day, count)
  values (v_owner, p_goal_id, p_day, greatest(0, p_delta))
  on conflict (goal_id, day) do update
    set count      = greatest(0, t.count + p_delta),
        updated_at = now()
  returning t.count into v_next;

  return v_next;
end;
$$;

grant execute on function public.adjust_tally(uuid, date, integer) to authenticated;

-- PostgREST caches the schema; without this the new RPC 404s until it reloads.
notify pgrst, 'reload schema';
