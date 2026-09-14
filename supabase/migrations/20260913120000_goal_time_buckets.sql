-- Time-of-day buckets for the tally screen.
--
-- A goal sits in exactly one bucket, and the bucket is independent of the
-- goal's direction: the Track page renders four buckets under Do More and four
-- under Do Less, so it is the (direction, bucket) pair that places a row.
--
-- Deliberately NOT effective-dated, unlike points and is_enabled. Those are
-- dated because they change what a past day scored; a bucket is a presentation
-- concern that no historical score depends on, so re-bucketing a goal should
-- apply everywhere at once rather than forking its history. This matches how
-- `name` and `emoji` are already treated on `goals`.
--
-- 'all_day' is the default, which is what lets every goal that predates this
-- migration keep appearing on the tally screen with no backfill step.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_bucket') then
    create type public.goal_bucket as enum ('morning', 'afternoon', 'evening', 'all_day');
  end if;
end
$$;

alter table public.goals
  add column if not exists bucket public.goal_bucket not null default 'all_day';

-- No new index: goals are grouped in JS from a list that is already fetched
-- whole (a handful of rows per user), so an index on bucket would only add
-- write cost. goals_user_idx still covers the ordering the query relies on.
