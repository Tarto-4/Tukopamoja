-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Tokupojomo — Migration 00003                             ║
-- ║  Milestone 3: player count sync + leaderboard helpers     ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────
-- increment_player_count: Atomically increment player_count
-- Called by client on join. Safe for concurrent calls.
-- ─────────────────────────────────────────────────────────────
create or replace function public.increment_player_count(p_session_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.sessions
  set player_count = player_count + 1
  where id = p_session_id;
end;
$$;

-- Allow anyone to call (players are anonymous)
grant execute on function public.increment_player_count(uuid) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Auto-sync player_count via trigger (backup mechanism)
-- Fires on INSERT/DELETE of session_players rows.
-- ─────────────────────────────────────────────────────────────
create or replace function public.sync_player_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    update public.sessions
    set player_count = (
      select count(*) from public.session_players where session_id = NEW.session_id
    )
    where id = NEW.session_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.sessions
    set player_count = (
      select count(*) from public.session_players where session_id = OLD.session_id
    )
    where id = OLD.session_id;
    return OLD;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_player_count on public.session_players;
create trigger trg_sync_player_count
  after insert or delete on public.session_players
  for each row
  execute function public.sync_player_count();
