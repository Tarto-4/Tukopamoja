-- Reset host gameplay history (sessions + host logs) and template play counters.
create or replace function public.reset_host_play_history()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_deleted_sessions int := 0;
  v_deleted_logs int := 0;
begin
  if v_host is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.host_action_logs
  where host_id = v_host;
  get diagnostics v_deleted_logs = row_count;

  delete from public.sessions
  where host_id = v_host;
  get diagnostics v_deleted_sessions = row_count;

  update public.templates
  set play_count = 0,
      updated_at = now()
  where created_by = v_host
    and coalesce(play_count, 0) <> 0;

  return jsonb_build_object(
    'deleted_sessions', v_deleted_sessions,
    'deleted_logs', v_deleted_logs
  );
end;
$$;

revoke all on function public.reset_host_play_history() from public;
grant execute on function public.reset_host_play_history() to authenticated;
