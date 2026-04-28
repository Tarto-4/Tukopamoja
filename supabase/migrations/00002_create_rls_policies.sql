-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Tokupojomo — Row Level Security Policies                  ║
-- ║  Migration 00002                                           ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Enable RLS on all tables
alter table public.organization enable row level security;
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.questions enable row level security;
alter table public.sessions enable row level security;
alter table public.session_players enable row level security;
alter table public.player_answers enable row level security;

-- ─── Organization (read: anyone, write: admin) ───────────────
create policy "org_read" on public.organization
  for select using (true);

create policy "org_update" on public.organization
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ─── Profiles ─────────────────────────────────────────────────
create policy "profiles_read_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- ─── Templates (CRUD for creators, read for all authenticated) ─
create policy "templates_read" on public.templates
  for select using (auth.uid() is not null);

create policy "templates_insert" on public.templates
  for insert with check (created_by = auth.uid());

create policy "templates_update" on public.templates
  for update using (created_by = auth.uid());

create policy "templates_delete" on public.templates
  for delete using (created_by = auth.uid());

-- ─── Questions ────────────────────────────────────────────────
create policy "questions_read" on public.questions
  for select using (
    exists (select 1 from public.templates t where t.id = template_id and (t.created_by = auth.uid() or t.is_published))
  );

create policy "questions_insert" on public.questions
  for insert with check (
    exists (select 1 from public.templates t where t.id = template_id and t.created_by = auth.uid())
  );

create policy "questions_update" on public.questions
  for update using (
    exists (select 1 from public.templates t where t.id = template_id and t.created_by = auth.uid())
  );

create policy "questions_delete" on public.questions
  for delete using (
    exists (select 1 from public.templates t where t.id = template_id and t.created_by = auth.uid())
  );

-- ─── Sessions ─────────────────────────────────────────────────
create policy "sessions_read" on public.sessions
  for select using (true);  -- players need to look up by PIN

create policy "sessions_insert" on public.sessions
  for insert with check (host_id = auth.uid());

create policy "sessions_update" on public.sessions
  for update using (host_id = auth.uid());

-- ─── Session Players (anon join allowed, read by all in session) ─
create policy "session_players_read" on public.session_players
  for select using (true);

create policy "session_players_insert" on public.session_players
  for insert with check (true);  -- anonymous players join via PIN

create policy "session_players_update" on public.session_players
  for update using (true);       -- score updates via server function

-- ─── Player Answers ─────────────────────────────────────────
create policy "player_answers_read" on public.player_answers
  for select using (true);

create policy "player_answers_insert" on public.player_answers
  for insert with check (true);

-- ─── Storage bucket for logos & media ─────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media_read" on storage.objects
  for select using (bucket_id = 'media');

create policy "media_upload" on storage.objects
  for insert with check (
    bucket_id = 'media' and auth.uid() is not null
  );

create policy "media_delete" on storage.objects
  for delete using (
    bucket_id = 'media' and auth.uid() is not null
  );
