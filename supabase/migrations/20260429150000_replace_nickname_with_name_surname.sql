-- ─────────────────────────────────────────────────────────────
-- TUKOPAMOJA — Replace nickname with first_name + last_name
-- Players now register with real name instead of nickname.
-- Display name = first_name || ' ' || last_name.
-- ─────────────────────────────────────────────────────────────

-- 1. Add new columns (keep nickname temporarily for backward compat)
alter table public.session_players
  add column if not exists first_name text,
  add column if not exists last_name text;

-- 2. Backfill: copy existing nickname into first_name
update public.session_players
set first_name = nickname,
    last_name = ''
where first_name is null;

-- 3. Make first_name and last_name not null
alter table public.session_players
  alter column first_name set not null,
  alter column first_name set default '',
  alter column last_name set not null,
  alter column last_name set default '';

-- 4. Drop the old unique constraint on (session_id, nickname)
--    and add new one on (session_id, first_name, last_name)
alter table public.session_players
  drop constraint if exists session_players_session_id_nickname_key;

alter table public.session_players
  add constraint session_players_session_id_name_key
  unique (session_id, first_name, last_name);

-- 5. Also update the join_attempts table if it has a nickname column
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'join_attempts' and column_name = 'nickname'
  ) then
    alter table public.join_attempts
      rename column nickname to first_name;
    alter table public.join_attempts
      add column if not exists last_name text not null default '';
  end if;
end $$;

-- 6. Recreate join_session_guarded with first_name + last_name
create or replace function public.join_session_guarded(
  p_pin text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_avatar text default '🎮'
)
returns table (
  session_id uuid,
  player_id uuid,
  session_status public.session_status
)
language plpgsql
security definer
as $$
declare
  v_session public.sessions;
  v_player public.session_players;
  v_email text;
  v_attempts int;
  v_first text;
  v_last text;
begin
  v_email := lower(trim(p_email));
  v_first := trim(p_first_name);
  v_last  := trim(p_last_name);

  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Enter a valid email address';
  end if;

  if length(v_first) < 1 or length(v_first) > 30 then
    raise exception 'First name must be between 1 and 30 characters';
  end if;

  if length(v_last) < 1 or length(v_last) > 30 then
    raise exception 'Last name must be between 1 and 30 characters';
  end if;

  select * into v_session
  from public.sessions s
  where s.pin = p_pin
    and s.status in ('lobby', 'question_active')
  order by s.created_at desc
  limit 1;

  if v_session.id is null then
    raise exception 'Game not found — check the PIN and try again.';
  end if;

  if v_session.lobby_locked then
    raise exception 'Lobby is locked by host';
  end if;

  if v_session.status = 'question_active' and not v_session.allow_late_join then
    raise exception 'Late join is disabled for this session';
  end if;

  insert into public.join_attempts(session_pin, email, first_name, last_name)
  values (p_pin, v_email, v_first, v_last);

  select count(*) into v_attempts
  from public.join_attempts ja
  where ja.email = v_email
    and ja.attempted_at > now() - interval '60 seconds';

  if v_attempts > 8 then
    raise exception 'Too many join attempts. Try again in a minute.';
  end if;

  insert into public.session_players(session_id, first_name, last_name, nickname, email, avatar, score, streak)
  values (v_session.id, v_first, v_last, v_first || ' ' || v_last, v_email, coalesce(nullif(trim(p_avatar), ''), '🎮'), 0, 0)
  returning * into v_player;

  update public.sessions s
  set player_count = (
    select count(*)
    from public.session_players sp
    where sp.session_id = v_session.id
      and sp.kicked_at is null
  )
  where s.id = v_session.id;

  return query
  select v_session.id, v_player.id, v_session.status;
end;
$$;

-- Drop old function signature and grant on new one
drop function if exists public.join_session_guarded(text, text, text, text);
grant execute on function public.join_session_guarded(text, text, text, text, text) to anon, authenticated;

-- 7. Update leaderboard RPC to include first_name, last_name
--    Must drop first because return type is changing (new OUT columns).
drop function if exists public.get_leaderboard_page(uuid, int, int);

create or replace function public.get_leaderboard_page(
  p_session_id uuid,
  p_limit int default 100,
  p_offset int default 0
)
returns table (
  player_id uuid,
  nickname text,
  first_name text,
  last_name text,
  avatar text,
  email text,
  score int,
  streak int,
  rank bigint
)
language sql
security definer
as $$
  select
    sp.id as player_id,
    coalesce(sp.first_name || ' ' || sp.last_name, sp.nickname) as nickname,
    sp.first_name,
    sp.last_name,
    coalesce(sp.avatar, '🎮') as avatar,
    sp.email,
    coalesce(sp.score, 0) as score,
    coalesce(sp.streak, 0) as streak,
    dense_rank() over (order by coalesce(sp.score,0) desc, sp.joined_at asc) as rank
  from public.session_players sp
  where sp.session_id = p_session_id
  order by score desc, joined_at asc
  limit greatest(1, least(p_limit, 1000))
  offset greatest(0, p_offset);
$$;

grant execute on function public.get_leaderboard_page(uuid, int, int) to anon, authenticated;
