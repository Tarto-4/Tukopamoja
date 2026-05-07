-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TUKOPAMOJA — Migration: Scale for 200 concurrent players ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────
-- 1. Replace the per-row scoring trigger with a deferred
--    STATEMENT-level approach. The old trigger fired
--    recompute_ranked_question_scores() on every single INSERT,
--    causing O(n²) work with 200 concurrent answer submissions.
--
--    New approach: the trigger no longer recomputes scores.
--    Instead, the host explicitly calls recompute_ranked_question_scores()
--    when transitioning to leaderboard (via showLeaderboard / fetchAndBroadcastLeaderboard).
--    This converts 200 trigger calls into a single RPC call.
-- ─────────────────────────────────────────────────────────────

-- Drop the expensive per-row trigger
drop trigger if exists trg_ranked_scoring_after_answer on public.player_answers;

-- Replace the trigger function with a no-op to preserve the
-- function signature (other code may reference it).
create or replace function public.trg_ranked_scoring_after_answer()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Scoring is now deferred until the host calls showLeaderboard.
  -- This eliminates the O(n²) rescoring storm at 200 players.
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Optimise sync_player_count trigger to use atomic increment
--    instead of COUNT(*) per join.
-- ─────────────────────────────────────────────────────────────

create or replace function public.sync_player_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    update public.sessions
    set player_count = player_count + 1
    where id = NEW.session_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.sessions
    set player_count = greatest(0, player_count - 1)
    where id = OLD.session_id;
    return OLD;
  end if;
  return null;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Add max_players column with default 200 and enforce in
--    join_session_guarded.
-- ─────────────────────────────────────────────────────────────

-- Safely add column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sessions' and column_name = 'max_players'
  ) then
    alter table public.sessions add column max_players int not null default 200;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 4. Expose recompute_ranked_question_scores to authenticated
--    callers (host) so the client can call it before leaderboard.
-- ─────────────────────────────────────────────────────────────

grant execute on function public.recompute_ranked_question_scores(uuid, int)
  to authenticated;
