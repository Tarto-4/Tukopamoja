-- Fix ambiguous column reference in join_session_guarded
-- Caused by RETURNS TABLE output variable names overlapping column names in PL/pgSQL scope.

create or replace function public.join_session_guarded(
  p_pin text,
  p_nickname text,
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
begin
  v_email := lower(trim(p_email));

  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Enter a valid email address';
  end if;

  if length(trim(p_nickname)) < 1 or length(trim(p_nickname)) > 20 then
    raise exception 'Nickname must be between 1 and 20 characters';
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

  insert into public.join_attempts(session_pin, email, nickname)
  values (p_pin, v_email, trim(p_nickname));

  select count(*) into v_attempts
  from public.join_attempts ja
  where ja.email = v_email
    and ja.attempted_at > now() - interval '60 seconds';

  if v_attempts > 8 then
    raise exception 'Too many join attempts. Try again in a minute.';
  end if;

  insert into public.session_players(session_id, nickname, email, avatar, score, streak)
  values (v_session.id, trim(p_nickname), v_email, coalesce(nullif(trim(p_avatar), ''), '🎮'), 0, 0)
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

grant execute on function public.join_session_guarded(text, text, text, text) to anon, authenticated;
