-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TUKOPAMOJA — Supabase Database Schema                     ║
-- ║  Migration 00001: Core tables, RLS, functions              ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. ORGANIZATION / BRAND SETTINGS
--    Single-row table for company branding (single-tenant).
-- ─────────────────────────────────────────────────────────────
create table public.organization (
  id            uuid primary key default gen_random_uuid(),
  name          text not null default 'TUKOPAMOJA',
  tagline       text default 'Real-time Quiz Platform',
  logo_url      text,                          -- Supabase Storage URL
  primary_color text not null default '#8E191E',
  secondary_color text not null default '#C9A84C',
  font_family   text not null default 'Inter',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Seed the single org row
insert into public.organization (name) values ('TUKOPAMOJA');

-- ─────────────────────────────────────────────────────────────
-- 2. PROFILES (linked to auth.users)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        text not null default 'host' check (role in ('admin', 'host')),
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 3. TEMPLATES
--    Reusable quiz blueprints. Never mutated during live play.
-- ─────────────────────────────────────────────────────────────
create table public.templates (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text default '',
  cover_image   text,                          -- optional cover
  is_published  boolean not null default false,
  question_count int not null default 0,       -- denormalized for list views
  play_count    int not null default 0,        -- how many times used
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_templates_created_by on public.templates(created_by);

-- ─────────────────────────────────────────────────────────────
-- 4. QUESTIONS (belong to a template)
-- ─────────────────────────────────────────────────────────────
create type public.question_type as enum ('multiple_choice', 'true_false');

create table public.questions (
  id              uuid primary key default gen_random_uuid(),
  template_id     uuid not null references public.templates(id) on delete cascade,
  question_text   text not null,
  question_type   public.question_type not null default 'multiple_choice',
  image_url       text,                        -- optional question image
  time_limit_sec  int not null default 20 check (time_limit_sec between 5 and 120),
  points          int not null default 1000,   -- max points available
  sort_order      int not null default 0,
  options         jsonb not null default '[]'::jsonb,
  -- options schema: [{ "text": "...", "is_correct": true/false }]
  created_at      timestamptz not null default now()
);

create index idx_questions_template on public.questions(template_id, sort_order);

-- ─────────────────────────────────────────────────────────────
-- 5. SESSIONS (a live game instance, created from a template)
-- ─────────────────────────────────────────────────────────────
create type public.session_status as enum (
  'lobby',
  'question_active',
  'evaluating',
  'leaderboard',
  'finished'
);

create table public.sessions (
  id              uuid primary key default gen_random_uuid(),
  template_id     uuid not null references public.templates(id),
  host_id         uuid not null references public.profiles(id),
  pin             text not null unique,         -- 6-digit game PIN
  status          public.session_status not null default 'lobby',
  current_q_index int not null default -1,      -- -1 = not started
  player_count    int not null default 0,
  started_at      timestamptz,
  ended_at        timestamptz,
  created_at      timestamptz not null default now(),

  -- Snapshot of questions at session-start so template edits don't affect live game
  questions_snapshot jsonb
);

create index idx_sessions_pin on public.sessions(pin);
create index idx_sessions_host on public.sessions(host_id);

-- ─────────────────────────────────────────────────────────────
-- 6. SESSION PLAYERS
-- ─────────────────────────────────────────────────────────────
create table public.session_players (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  nickname    text not null,
  avatar      text default '🎮',
  score       int not null default 0,
  streak      int not null default 0,
  rank        int,
  joined_at   timestamptz not null default now(),

  unique(session_id, nickname)
);

create index idx_session_players_session on public.session_players(session_id);

-- ─────────────────────────────────────────────────────────────
-- 7. PLAYER ANSWERS (per-question response tracking)
-- ─────────────────────────────────────────────────────────────
create table public.player_answers (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.sessions(id) on delete cascade,
  player_id       uuid not null references public.session_players(id) on delete cascade,
  question_index  int not null,
  selected_option int not null,                -- index into options array
  is_correct      boolean not null default false,
  time_taken_ms   int not null default 0,      -- milliseconds to answer
  points_awarded  int not null default 0,
  answered_at     timestamptz not null default now(),

  unique(session_id, player_id, question_index)
);

-- ─────────────────────────────────────────────────────────────
-- 8. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- Generate a unique 6-digit PIN
create or replace function public.generate_unique_pin()
returns text
language plpgsql
as $$
declare
  new_pin text;
  pin_exists boolean;
begin
  loop
    new_pin := lpad(floor(random() * 1000000)::text, 6, '0');
    select exists(
      select 1 from public.sessions
      where pin = new_pin and status != 'finished'
    ) into pin_exists;
    exit when not pin_exists;
  end loop;
  return new_pin;
end;
$$;

-- Create a session from a template (snapshots questions)
create or replace function public.create_session(
  p_template_id uuid,
  p_host_id uuid
)
returns public.sessions
language plpgsql security definer
as $$
declare
  v_session public.sessions;
  v_questions jsonb;
begin
  -- Snapshot template questions
  select jsonb_agg(
    jsonb_build_object(
      'question_text', q.question_text,
      'question_type', q.question_type,
      'image_url', q.image_url,
      'time_limit_sec', q.time_limit_sec,
      'points', q.points,
      'options', q.options
    ) order by q.sort_order
  )
  into v_questions
  from public.questions q
  where q.template_id = p_template_id;

  if v_questions is null or jsonb_array_length(v_questions) = 0 then
    raise exception 'Template has no questions';
  end if;

  insert into public.sessions (template_id, host_id, pin, questions_snapshot)
  values (p_template_id, p_host_id, public.generate_unique_pin(), v_questions)
  returning * into v_session;

  -- Increment play_count on the template
  update public.templates set play_count = play_count + 1 where id = p_template_id;

  return v_session;
end;
$$;

-- Calculate score: S = floor(max_points * (1 - time_taken / (2 * time_limit)))
create or replace function public.calculate_score(
  p_max_points int,
  p_time_taken_ms int,
  p_time_limit_sec int,
  p_is_correct boolean,
  p_streak int
)
returns int
language plpgsql immutable
as $$
declare
  v_base_score int;
  v_time_limit_ms int;
  v_multiplier numeric;
begin
  if not p_is_correct then return 0; end if;

  v_time_limit_ms := p_time_limit_sec * 1000;
  v_base_score := floor(
    p_max_points * greatest(0, 1.0 - (p_time_taken_ms::numeric / (2.0 * v_time_limit_ms)))
  );

  -- Streak multiplier: 1.0 for streak 0-1, +0.1 per streak (max 1.5x)
  v_multiplier := least(1.5, 1.0 + greatest(0, p_streak - 1) * 0.1);

  return floor(v_base_score * v_multiplier);
end;
$$;

-- Update question_count on template after insert/delete on questions
create or replace function public.sync_question_count()
returns trigger
language plpgsql
as $$
begin
  update public.templates
  set question_count = (
    select count(*) from public.questions where template_id = coalesce(new.template_id, old.template_id)
  ),
  updated_at = now()
  where id = coalesce(new.template_id, old.template_id);
  return coalesce(new, old);
end;
$$;

create trigger trg_sync_question_count
  after insert or delete on public.questions
  for each row execute function public.sync_question_count();

-- updated_at auto-touch
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_templates_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

create trigger trg_org_updated_at
  before update on public.organization
  for each row execute function public.set_updated_at();
