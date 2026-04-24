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
  answerRank: number; // 1 = fastest
  activePlayers: number;
  currentStreak: number; // streak BEFORE this answer
}

export interface ScoreResult {
  points: number;
  newStreak: number;
  multiplier: number; // rank share applied (0..1)
}

/**
 * Rank-based score for a single answer.
 * Fastest correct answer receives max points. Later answers receive
 * fractional shares down to `MIN_RANK_SHARE` for the slowest valid answer.
 */
export function calculateScore(input: ScoreInput): ScoreResult {
  const {
    maxPoints,
    timeTakenMs,
    timeLimitSec,
    isCorrect,
    answerRank,
    activePlayers,
    currentStreak,
  } =
    input;

  if (!isCorrect) {
    return { points: 0, newStreak: 0, multiplier: 1 };
  }

  const timeLimitMs = Math.max(1, timeLimitSec * 1000);
  if (timeTakenMs >= timeLimitMs) {
    return { points: 0, newStreak: 0, multiplier: 1 };
  }

  const rank = Math.max(1, answerRank);
  const playerCount = Math.max(1, activePlayers);
  const boundedRank = Math.min(rank, playerCount);
  const rankShare = Math.max(
    SCORING.MIN_RANK_SHARE,
    1 / (1 + SCORING.RANK_DECAY_FACTOR * (boundedRank - 1))
  );

  const newStreak = currentStreak + 1;
  const points = Math.floor(maxPoints * rankShare);

  return { points, newStreak, multiplier: rankShare };
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
