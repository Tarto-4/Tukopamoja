-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TUKOPAMOJA — Data Management Policies & RPCs              ║
-- ║  - Allow hosts to delete their own sessions                ║
-- ║  - RPC to list archived sessions for the calling host      ║
-- ║  - RPC to restore a single archived session                ║
-- ║  - RPC to delete a single session safely                   ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── 1) Delete policy: hosts can delete their own sessions ───
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'sessions' and policyname = 'sessions_delete'
  ) then
    create policy "sessions_delete" on public.sessions
      for delete using (host_id = auth.uid());
  end if;
end $$;

-- ─── 2) RPC: list archived sessions for the calling host ─────
--    archived_sessions has all access revoked from authenticated,
--    so we use a security-definer function to read only the
--    calling host's archives.
create or replace function public.list_my_archived_sessions(
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  archived_at timestamptz,
  template_title text,
  pin text,
  player_count int,
  created_at timestamptz,
  ended_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    a.id,
    a.archived_at,
    a.payload -> 'session' ->> 'template_title' as template_title,
    a.payload -> 'session' ->> 'pin' as pin,
    coalesce((a.payload -> 'session' ->> 'player_count')::int, 0) as player_count,
    (a.payload -> 'session' ->> 'created_at')::timestamptz as created_at,
    (a.payload -> 'session' ->> 'ended_at')::timestamptz as ended_at
  from public.archived_sessions a
  where (a.payload -> 'session' ->> 'host_id')::uuid = auth.uid()
  order by a.archived_at desc
  limit greatest(1, least(p_limit, 200))
  offset greatest(0, p_offset);
$$;

grant execute on function public.list_my_archived_sessions(int, int) to authenticated;

-- ─── 3) RPC: get full archive payload ────────────────────────
create or replace function public.get_archived_session(p_archive_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
begin
  select a.payload into v_payload
  from public.archived_sessions a
  where a.id = p_archive_id
    and (a.payload -> 'session' ->> 'host_id')::uuid = auth.uid();

  if v_payload is null then
    raise exception 'Archived session not found or not yours';
  end if;

  return v_payload;
end;
$$;

grant execute on function public.get_archived_session(uuid) to authenticated;

-- ─── 4) RPC: delete a single session (host only) ────────────
--    Uses security definer so cascade deletes work cleanly.
create or replace function public.delete_single_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_session public.sessions;
begin
  if v_host is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_session
  from public.sessions s
  where s.id = p_session_id
    and s.host_id = v_host;

  if v_session.id is null then
    raise exception 'Session not found or not yours';
  end if;

  -- Prevent deleting an active game
  if v_session.status not in ('lobby', 'finished') then
    raise exception 'Cannot delete an active session. End the game first.';
  end if;

  delete from public.sessions where id = p_session_id;

  return jsonb_build_object(
    'deleted_session_id', p_session_id,
    'status', 'deleted'
  );
end;
$$;

grant execute on function public.delete_single_session(uuid) to authenticated;

-- ─── 5) RPC: permanently delete an archived session ──────────
create or replace function public.delete_archived_session(p_archive_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_found boolean;
begin
  if v_host is null then
    raise exception 'Not authenticated';
  end if;

  select exists(
    select 1 from public.archived_sessions a
    where a.id = p_archive_id
      and (a.payload -> 'session' ->> 'host_id')::uuid = v_host
  ) into v_found;

  if not v_found then
    raise exception 'Archived session not found or not yours';
  end if;

  delete from public.archived_sessions where id = p_archive_id;

  return jsonb_build_object(
    'deleted_archive_id', p_archive_id,
    'status', 'deleted'
  );
end;
$$;

grant execute on function public.delete_archived_session(uuid) to authenticated;
