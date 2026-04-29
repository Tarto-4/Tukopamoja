-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TUKOPAMOJA — Security hardening                            ║
-- ║  - Enable RLS on archived_sessions                          ║
-- ║  - Remove definer-context from analytics views              ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1) archived_sessions is in public schema and must have RLS enabled.
alter table if exists public.archived_sessions enable row level security;

-- Keep archived payloads private to privileged DB roles/functions.
revoke all on table public.archived_sessions from anon;
revoke all on table public.archived_sessions from authenticated;

-- 2) Ensure analytics views run with caller permissions/RLS, not owner bypass.
alter view if exists public.v_session_join_funnel set (security_invoker = true);
alter view if exists public.v_session_completion set (security_invoker = true);
alter view if exists public.v_session_dropoff set (security_invoker = true);
