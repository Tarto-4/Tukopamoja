#!/usr/bin/env bash
set -euo pipefail

MIGRATION_FILE="supabase/migrations/00002_create_rls_policies.sql"

if [[ ! -f "$MIGRATION_FILE" ]]; then
  echo "❌ Missing migration file: $MIGRATION_FILE"
  exit 1
fi

PASS=0
FAIL=0

ok() { PASS=$((PASS + 1)); echo "  ✅ $1"; }
bad() { FAIL=$((FAIL + 1)); echo "  ❌ $1"; }

assert_contains() {
  local pattern="$1"
  local description="$2"
  if grep -Eq "$pattern" "$MIGRATION_FILE"; then
    ok "$description"
  else
    bad "$description"
  fi
}

echo "╔══════════════════════════════════════════╗"
echo "║   TUKOPAMOJA RLS Policy Verification     ║"
echo "╚══════════════════════════════════════════╝"

echo ""
echo "── RLS enabled checks ──"
for table in organization profiles templates questions sessions session_players player_answers; do
  assert_contains "alter table public\\.${table} enable row level security;" "RLS enabled on public.${table}"
done

echo ""
echo "── Core policy checks ──"
assert_contains "create policy \"templates_insert\"" "templates insert policy exists"
assert_contains "create policy \"templates_update\"" "templates update policy exists"
assert_contains "create policy \"questions_insert\"" "questions insert policy exists"
assert_contains "create policy \"sessions_insert\"" "sessions insert policy exists"
assert_contains "create policy \"session_players_insert\"" "session_players insert policy exists"
assert_contains "create policy \"player_answers_insert\"" "player_answers insert policy exists"

echo ""
echo "── Summary ──"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
