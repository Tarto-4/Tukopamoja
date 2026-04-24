-- Ensure game tables are streamed via Supabase Realtime.
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'sessions'
    ) then
      execute 'alter publication supabase_realtime add table public.sessions';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'session_players'
    ) then
      execute 'alter publication supabase_realtime add table public.session_players';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'player_answers'
    ) then
      execute 'alter publication supabase_realtime add table public.player_answers';
    end if;
  end if;
end
$$;

-- Capture player email during join flow for post-game follow-up.
alter table public.session_players
add column if not exists email text;
