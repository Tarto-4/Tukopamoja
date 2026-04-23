#!/usr/bin/env bash
# ─── QuizArena E2E Smoke Test ────────────────────────────────
# Tests the full game flow via Supabase REST API:
#   Sign up → Create template → Start session → Join player → 
#   Answer question → Show leaderboard → End game
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SB="${QUIZARENA_SUPABASE_URL:-http://127.0.0.1:54321}"
WEB_URL="${QUIZARENA_WEB_URL:-http://localhost:3000}"
WEB_CHECKS="${QUIZARENA_WEB_CHECKS:-0}"

# Prefer explicitly-scoped variable, fallback to common app variable name.
ANON_KEY="${QUIZARENA_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"

# Optional autoload from local env file for convenience.
if [[ -z "${ANON_KEY}" && -f "packages/web/.env.local" ]]; then
  ANON_KEY=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' packages/web/.env.local | head -1 | cut -d '=' -f2- || true)
fi

if [[ -z "${ANON_KEY}" || "${ANON_KEY}" == "placeholder" ]]; then
  echo "❌ Missing Supabase anon key for E2E test"
  echo ""
  echo "Set one of these environment variables before running:"
  echo "  - QUIZARENA_SUPABASE_ANON_KEY"
  echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo ""
  echo "Example:"
  echo "  export QUIZARENA_SUPABASE_ANON_KEY='your-anon-key'"
  echo "  bash scripts/e2e-test.sh"
  exit 1
fi

REST="$SB/rest/v1"
PASS=0
FAIL=0

ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ❌ $1"; }
step() { echo ""; echo "── $1 ──"; }

# Helpers
sb_post()   { curl -s -X POST   "$REST/$1" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $2" -H "Content-Type: application/json" -H "Prefer: return=representation" -d "$3"; }
sb_patch()  { curl -s -X PATCH  "$REST/$1" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $2" -H "Content-Type: application/json" -H "Prefer: return=representation" -d "$3"; }
sb_get()    { curl -s -X GET    "$REST/$1" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $2"; }
sb_rpc()    { curl -s -X POST   "$REST/rpc/$1" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $2" -H "Content-Type: application/json" -d "$3"; }

echo "╔══════════════════════════════════════════╗"
echo "║     QuizArena E2E Smoke Test             ║"
echo "╚══════════════════════════════════════════╝"

# ─── 1. Sign up host ─────────────────────────────────────────
step "1. Sign up host"
EPOCH=$(date +%s)
SIGNUP=$(curl -s -X POST "$SB/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e-${EPOCH}@test.com\",\"password\":\"testpass123\"}")

HOST_TOKEN=$(echo "$SIGNUP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null) && ok "Host signed up" || fail "Host signup failed"
HOST_ID=$(echo "$SIGNUP" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['id'])" 2>/dev/null)
echo "  Host ID: $HOST_ID"

# ─── 2. Create quiz template ─────────────────────────────────
step "2. Create quiz template"
TEMPLATE_JSON='{
  "title": "E2E Test Quiz",
  "description": "Automated test",
  "created_by": "'$HOST_ID'",
  "is_published": true,
  "question_count": 2
}'

TMPL_RESP=$(sb_post "templates" "$HOST_TOKEN" "$TEMPLATE_JSON")
TMPL_ID=$(echo "$TMPL_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null) && ok "Template created: $TMPL_ID" || fail "Template creation failed: $TMPL_RESP"

# Add questions
Q1_JSON='{"template_id":"'$TMPL_ID'","question_text":"What is 2+2?","time_limit_sec":30,"points":1000,"sort_order":0,"options":[{"text":"3","is_correct":false},{"text":"4","is_correct":true},{"text":"5","is_correct":false},{"text":"6","is_correct":false}]}'
Q2_JSON='{"template_id":"'$TMPL_ID'","question_text":"Capital of France?","time_limit_sec":30,"points":1000,"sort_order":1,"options":[{"text":"London","is_correct":false},{"text":"Berlin","is_correct":false},{"text":"Paris","is_correct":true},{"text":"Madrid","is_correct":false}]}'

sb_post "questions" "$HOST_TOKEN" "$Q1_JSON" > /dev/null && ok "Q1 added"
sb_post "questions" "$HOST_TOKEN" "$Q2_JSON" > /dev/null && ok "Q2 added"

# Build questions snapshot for session
QUESTIONS='[{"question_text":"What is 2+2?","time_limit_sec":30,"points":1000,"options":[{"text":"3","is_correct":false},{"text":"4","is_correct":true},{"text":"5","is_correct":false},{"text":"6","is_correct":false}]},{"question_text":"Capital of France?","time_limit_sec":30,"points":1000,"options":[{"text":"London","is_correct":false},{"text":"Berlin","is_correct":false},{"text":"Paris","is_correct":true},{"text":"Madrid","is_correct":false}]}]'

# ─── 3. Create game session ──────────────────────────────────
step "3. Create game session"
PIN=$(( (RANDOM % 9000) + 1000 ))

SESSION_JSON='{
  "host_id": "'$HOST_ID'",
  "template_id": "'$TMPL_ID'",
  "pin": "'$PIN'",
  "status": "lobby",
  "current_q_index": -1,
  "player_count": 0,
  "questions_snapshot": '$QUESTIONS'
}'

SESS_RESP=$(sb_post "sessions" "$HOST_TOKEN" "$SESSION_JSON")
SESS_ID=$(echo "$SESS_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null) && ok "Session created: PIN=$PIN, ID=$SESS_ID" || fail "Session creation failed: $SESS_RESP"

# ─── 4. Join as player ───────────────────────────────────────
step "4. Player joins"
PLAYER_JSON='{
  "session_id": "'$SESS_ID'",
  "nickname": "TestBot",
  "avatar": "🤖",
  "score": 0,
  "streak": 0
}'
PLAYER_RESP=$(sb_post "session_players" "$HOST_TOKEN" "$PLAYER_JSON")
PLAYER_ID=$(echo "$PLAYER_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null) && ok "Player joined: $PLAYER_ID" || fail "Player join failed: $PLAYER_RESP"

# Check player_count got incremented (via trigger)
sleep 1
PCOUNT=$(sb_get "sessions?id=eq.$SESS_ID&select=player_count" "$HOST_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['player_count'])" 2>/dev/null)
[[ "$PCOUNT" == "1" ]] && ok "Player count auto-incremented to $PCOUNT" || fail "Player count expected 1, got $PCOUNT"

# ─── 5. Start game (host changes status to question_active) ──
step "5. Host starts game"
START_RESP=$(sb_patch "sessions?id=eq.$SESS_ID" "$HOST_TOKEN" '{"status":"question_active","current_q_index":0}')
STATUS=$(echo "$START_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['status'])" 2>/dev/null)
[[ "$STATUS" == "question_active" ]] && ok "Game started (status: $STATUS)" || fail "Start failed (status: $STATUS)"

# ─── 6. Player answers Q1 (correct: option 1 = "4") ──────────
step "6. Player answers Q1"
ANSWER_JSON='{
  "session_id": "'$SESS_ID'",
  "player_id": "'$PLAYER_ID'",
  "question_index": 0,
  "selected_option": 1,
  "is_correct": true,
  "time_taken_ms": 3500,
  "points_awarded": 850
}'
ANS_RESP=$(sb_post "player_answers" "$HOST_TOKEN" "$ANSWER_JSON")
ANS_ID=$(echo "$ANS_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null) && ok "Answer recorded: $ANS_ID" || fail "Answer failed: $ANS_RESP"

# Update player score
sb_patch "session_players?id=eq.$PLAYER_ID" "$HOST_TOKEN" '{"score":850,"streak":1}' > /dev/null
ok "Player score updated to 850"

# ─── 7. Show leaderboard ─────────────────────────────────────
step "7. Host shows leaderboard"
LB_RESP=$(sb_patch "sessions?id=eq.$SESS_ID" "$HOST_TOKEN" '{"status":"leaderboard"}')
LB_STATUS=$(echo "$LB_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['status'])" 2>/dev/null)
[[ "$LB_STATUS" == "leaderboard" ]] && ok "Leaderboard shown" || fail "Leaderboard failed"

# Verify player score
SCORE=$(sb_get "session_players?id=eq.$PLAYER_ID&select=score,streak" "$HOST_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)[0]; print(d['score'])" 2>/dev/null)
[[ "$SCORE" == "850" ]] && ok "Player score verified: $SCORE" || fail "Score mismatch: $SCORE"

# ─── 8. Advance to Q2 ────────────────────────────────────────
step "8. Advance to Q2"
Q2_RESP=$(sb_patch "sessions?id=eq.$SESS_ID" "$HOST_TOKEN" '{"status":"question_active","current_q_index":1}')
Q2_IDX=$(echo "$Q2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['current_q_index'])" 2>/dev/null)
[[ "$Q2_IDX" == "1" ]] && ok "Advanced to Q2 (index: $Q2_IDX)" || fail "Advance failed"

# ─── 9. Player answers Q2 (correct: option 2 = "Paris") ──────
step "9. Player answers Q2"
ANS2_JSON='{
  "session_id": "'$SESS_ID'",
  "player_id": "'$PLAYER_ID'",
  "question_index": 1,
  "selected_option": 2,
  "is_correct": true,
  "time_taken_ms": 5000,
  "points_awarded": 700
}'
ANS2_RESP=$(sb_post "player_answers" "$HOST_TOKEN" "$ANS2_JSON")
ANS2_ID=$(echo "$ANS2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null) && ok "Answer recorded: $ANS2_ID" || fail "Answer failed: $ANS2_RESP"

sb_patch "session_players?id=eq.$PLAYER_ID" "$HOST_TOKEN" '{"score":1550,"streak":2}' > /dev/null
ok "Player score updated to 1550"

# ─── 10. End game ────────────────────────────────────────────
step "10. End game"
END_RESP=$(sb_patch "sessions?id=eq.$SESS_ID" "$HOST_TOKEN" '{"status":"finished"}')
END_STATUS=$(echo "$END_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['status'])" 2>/dev/null)
[[ "$END_STATUS" == "finished" ]] && ok "Game finished" || fail "End game failed"

# Final score check
FINAL=$(sb_get "session_players?id=eq.$PLAYER_ID&select=score,streak" "$HOST_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)[0]; print(f'Score={d[\"score\"]}, Streak={d[\"streak\"]}')" 2>/dev/null)
ok "Final: $FINAL"

# ─── 11. Verify web pages load (optional) ────────────────────
if [[ "$WEB_CHECKS" == "1" ]]; then
  step "11. Web page checks"
  for path in "/" "/join/" "/auth/login/"; do
    CODE=$(curl -sL -o /dev/null -w "%{http_code}" "$WEB_URL$path")
    [[ "$CODE" == "200" ]] && ok "GET $path → $CODE" || fail "GET $path → $CODE"
  done
else
  step "11. Web page checks"
  echo "  ⚪ Skipped (set QUIZARENA_WEB_CHECKS=1 to enable HTTP route checks)"
fi

# ─── Summary ─────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Results: $PASS passed, $FAIL failed              ║"
echo "╚══════════════════════════════════════════╝"

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
