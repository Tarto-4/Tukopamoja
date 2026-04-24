-- Advanced interactivity, controls, reliability, analytics, and ops foundations

-- ─────────────────────────────────────────────────────────────
-- Session controls
-- ─────────────────────────────────────────────────────────────
alter table public.sessions
  add column if not exists lobby_locked boolean not null default false,
  add column if not exists allow_late_join boolean not null default false,
  add column if not exists is_paused boolean not null default false,
  add column if not exists current_question_started_at timestamptz,
  add column if not exists current_question_time_limit_sec int,
  add column if not exists current_question_remaining_sec int;

alter table public.session_players
  add column if not exists is_ready boolean not null default false,
  add column if not exists ready_at timestamptz,
  add column if not exists is_muted boolean not null default false,
  add column if not exists kicked_at timestamptz;

create index if not exists idx_session_players_session_joined
  on public.session_players(session_id, joined_at desc);

-- ─────────────────────────────────────────────────────────────
-- Audit logs + join rate limiting
-- ─────────────────────────────────────────────────────────────
create table if not exists public.host_action_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  host_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_host_action_logs_session_created
  on public.host_action_logs(session_id, created_at desc);

create table if not exists public.join_attempts (
  id uuid primary key default gen_random_uuid(),
  session_pin text not null,
  email text not null,
  nickname text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_join_attempts_email_time
  on public.join_attempts(email, attempted_at desc);

alter table public.host_action_logs enable row level security;
alter table public.join_attempts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='host_action_logs' and policyname='host_action_logs_host_read'
  ) then
    create policy "host_action_logs_host_read"
      on public.host_action_logs
      for select
      using (
        host_id = auth.uid()
        or exists (
          select 1 from public.sessions s
          where s.id = session_id and s.host_id = auth.uid()
        )
      );
  end if;
end
$$;

-- ─────────────────────────────────────────────────────────────
-- Leaderboard aggregation RPC (paged)
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_leaderboard_page(
  p_session_id uuid,
  p_limit int default 100,
  p_offset int default 0
)
returns table (
  player_id uuid,
  nickname text,
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
    sp.nickname,
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

-- ─────────────────────────────────────────────────────────────
-- Host action audit writer
-- ─────────────────────────────────────────────────────────────
create or replace function public.log_host_action(
  p_session_id uuid,
  p_action text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  v_host_id uuid;
begin
  select host_id into v_host_id from public.sessions where id = p_session_id;

  insert into public.host_action_logs(session_id, host_id, action, metadata)
  values (p_session_id, v_host_id, p_action, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

grant execute on function public.log_host_action(uuid, text, jsonb) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Guarded join RPC with stronger validation and rate limiting
-- ─────────────────────────────────────────────────────────────
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
  from public.sessions
  where pin = p_pin
    and status in ('lobby', 'question_active')
  order by created_at desc
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
  from public.join_attempts
  where email = v_email
    and attempted_at > now() - interval '60 seconds';

  if v_attempts > 8 then
    raise exception 'Too many join attempts. Try again in a minute.';
  end if;

  insert into public.session_players(session_id, nickname, email, avatar, score, streak)
  values (v_session.id, trim(p_nickname), v_email, coalesce(nullif(trim(p_avatar), ''), '🎮'), 0, 0)
  returning * into v_player;

  update public.sessions
  set player_count = (
    select count(*) from public.session_players where session_id = v_session.id and kicked_at is null
  )
  where id = v_session.id;

  return query
  select v_session.id, v_player.id, v_session.status;
end;
$$;

grant execute on function public.join_session_guarded(text, text, text, text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Analytics views (join funnel, completion, drop-off)
-- ─────────────────────────────────────────────────────────────
create or replace view public.v_session_join_funnel as
select
  s.id as session_id,
  s.pin,
  s.created_at,
  coalesce((select count(*) from public.join_attempts ja where ja.session_pin = s.pin), 0)::int as join_attempts,
  coalesce((select count(*) from public.session_players sp where sp.session_id = s.id), 0)::int as joined_players,
  case
    when (select count(*) from public.join_attempts ja where ja.session_pin = s.pin) = 0 then 0
    else round(
      ((select count(*)::numeric from public.session_players sp where sp.session_id = s.id) /
      greatest((select count(*)::numeric from public.join_attempts ja where ja.session_pin = s.pin), 1)) * 100,
      2
    )
  end as join_conversion_pct
from public.sessions s;

create or replace view public.v_session_completion as
select
  s.id as session_id,
  s.pin,
  s.status,
  coalesce((select count(*) from public.session_players sp where sp.session_id = s.id), 0)::int as players_joined,
  coalesce((
    select count(distinct pa.player_id)
    from public.player_answers pa
    where pa.session_id = s.id
  ), 0)::int as players_answered_any,
  case
    when coalesce((select count(*) from public.session_players sp where sp.session_id = s.id), 0) = 0 then 0
    else round(
      ((
        select count(distinct pa.player_id)::numeric
        from public.player_answers pa
        where pa.session_id = s.id
      ) /
      greatest((select count(*)::numeric from public.session_players sp where sp.session_id = s.id), 1)) * 100,
      2
    )
  end as engagement_pct
from public.sessions s;

create or replace view public.v_session_dropoff as
with answered as (
  select
    pa.session_id,
    pa.question_index,
    count(distinct pa.player_id)::int as answered_players
  from public.player_answers pa
  group by pa.session_id, pa.question_index
),
base as (
  select
    s.id as session_id,
    q.idx as question_index,
    coalesce(a.answered_players, 0) as answered_players,
    coalesce((select count(*) from public.session_players sp where sp.session_id = s.id), 0)::int as joined_players
  from public.sessions s
  cross join lateral generate_series(0, greatest(coalesce(jsonb_array_length(s.questions_snapshot), 1) - 1, 0)) as q(idx)
  left join answered a on a.session_id = s.id and a.question_index = q.idx
)
select
  session_id,
  question_index,
  joined_players,
  answered_players,
  greatest(joined_players - answered_players, 0)::int as dropped_players,
  case when joined_players = 0 then 0 else round(((joined_players - answered_players)::numeric / joined_players::numeric) * 100, 2) end as dropoff_pct
from base;

grant select on public.v_session_join_funnel to authenticated;
grant select on public.v_session_completion to authenticated;
grant select on public.v_session_dropoff to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Cleanup + archive routine
-- ─────────────────────────────────────────────────────────────
create table if not exists public.archived_sessions (
  id uuid primary key,
  archived_at timestamptz not null default now(),
  payload jsonb not null
);

create or replace function public.archive_and_cleanup_finished_sessions(
  p_older_than_days int default 14,
  p_batch_size int default 200
)
returns int
language plpgsql
security definer
as $$
declare
  v_deleted int := 0;
begin
  with to_archive as (
    select s.id,
      jsonb_build_object(
        'session', to_jsonb(s),
        'players', coalesce((select jsonb_agg(to_jsonb(sp)) from public.session_players sp where sp.session_id = s.id), '[]'::jsonb),
        'answers', coalesce((select jsonb_agg(to_jsonb(pa)) from public.player_answers pa where pa.session_id = s.id), '[]'::jsonb)
      ) as payload
    from public.sessions s
    where s.status = 'finished'
      and coalesce(s.ended_at, s.created_at) < now() - make_interval(days => greatest(1, p_older_than_days))
    order by coalesce(s.ended_at, s.created_at)
    limit greatest(1, least(p_batch_size, 2000))
  )
  insert into public.archived_sessions(id, payload)
  select id, payload from to_archive
  on conflict (id) do nothing;

  delete from public.sessions s
  where s.id in (
    select a.id
    from public.archived_sessions a
    where a.archived_at > now() - interval '10 minutes'
    limit greatest(1, least(p_batch_size, 2000))
  );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function public.archive_and_cleanup_finished_sessions(int, int) to authenticated;

-- Best-effort scheduling (requires pg_cron; safely ignored if unavailable)
do $$
begin
  begin
    perform cron.schedule(
      'quizarena_archive_cleanup_daily',
      '15 3 * * *',
      'select public.archive_and_cleanup_finished_sessions(14, 500);'
    );
  exception when undefined_function or invalid_schema_name then
    null;
  end;
end
$$;
