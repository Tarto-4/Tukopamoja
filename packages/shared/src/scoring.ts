// ─────────────────────────────────────────────────────────────
// QuizArena — Scoring Engine
// Shared between web (evaluation) and mobile (optimistic UI).
// Mirrors the PostgreSQL function `calculate_score`.
// ─────────────────────────────────────────────────────────────

import { SCORING } from "./constants";

export interface ScoreInput {
  maxPoints: number;
  timeTakenMs: number;
  timeLimitSec: number;
  isCorrect: boolean;
  currentStreak: number; // streak BEFORE this answer
}

export interface ScoreResult {
  points: number;
  newStreak: number;
  multiplier: number;
}

/**
 * Calculate points for a single answer.
 *
 * Formula: S = floor(maxPoints × max(0, 1 − timeTaken / (2 × timeLimit)))
 * Streak:  ×(1 + (streak − 1) × 0.1), capped at 1.5×
 */
export function calculateScore(input: ScoreInput): ScoreResult {
  const { maxPoints, timeTakenMs, timeLimitSec, isCorrect, currentStreak } =
    input;

  if (!isCorrect) {
    return { points: 0, newStreak: 0, multiplier: 1 };
  }

  const timeLimitMs = timeLimitSec * 1000;
  const timeFraction = timeTakenMs / (SCORING.SPEED_FACTOR * timeLimitMs);
  const baseScore = Math.floor(maxPoints * Math.max(0, 1 - timeFraction));

  const newStreak = currentStreak + 1;
  const multiplier = Math.min(
    SCORING.STREAK_BONUS_CAP,
    1 + Math.max(0, newStreak - 1) * SCORING.STREAK_BONUS_PER
  );

  const points = Math.floor(baseScore * multiplier);

  return { points, newStreak, multiplier };
}

/**
 * Sort players by score descending, assign rank (1-based).
 * Players with equal score get the same rank.
 */
export function rankPlayers<T extends { score: number }>(
  players: T[]
): (T & { rank: number })[] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  let currentRank = 1;

  return sorted.map((player, index) => {
    if (index > 0 && player.score < sorted[index - 1].score) {
      currentRank = index + 1;
    }
    return { ...player, rank: currentRank };
  });
}
