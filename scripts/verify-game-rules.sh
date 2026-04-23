#!/usr/bin/env bash
set -euo pipefail

python3 <<'PY'
import math

def calculate_score(max_points, time_taken_ms, time_limit_sec, is_correct, current_streak):
    if not is_correct:
        return 0, 0, 1.0

    time_limit_ms = time_limit_sec * 1000
    time_fraction = time_taken_ms / (2 * time_limit_ms)
    base_score = math.floor(max_points * max(0, 1 - time_fraction))

    new_streak = current_streak + 1
    multiplier = min(1.5, 1 + max(0, new_streak - 1) * 0.1)
    points = math.floor(base_score * multiplier)
    return points, new_streak, multiplier

# Deterministic scoring checks
assert calculate_score(1000, 0, 20, True, 0)[0] == 1000
assert calculate_score(1000, 20000, 20, True, 0)[0] == 500
assert calculate_score(1000, 10000, 20, True, 2)[0] == 900
assert calculate_score(1000, 5000, 20, False, 4)[0] == 0

# Session state transition checks
flow = ["lobby", "question_active", "evaluating", "leaderboard", "finished"]
allowed = {
    "lobby": {"question_active", "finished"},
    "question_active": {"evaluating", "finished"},
    "evaluating": {"leaderboard", "finished"},
    "leaderboard": {"question_active", "finished"},
    "finished": set(),
}

for i in range(len(flow) - 1):
    assert flow[i + 1] in allowed[flow[i]]

assert "lobby" not in allowed["leaderboard"]
assert "question_active" not in allowed["finished"]

print("✅ verify-game-rules: scoring and session flow checks passed")
PY
