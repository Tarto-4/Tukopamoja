// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Game Constants
// ─────────────────────────────────────────────────────────────

/** Session status flow */
export const SESSION_FLOW = [
  "lobby",
  "question_active",
  "evaluating",
  "leaderboard",
  "finished",
] as const;

/** Default scoring parameters */
export const SCORING = {
  /** Maximum points for a perfect answer */
  MAX_POINTS: 1000,
  /** Explicit rank-based shares awarded by correct answer order */
  RANK_SHARES: [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
  /** Lowest rank-based share awarded once the explicit ladder is exhausted */
  MIN_RANK_SHARE: 0.2,
} as const;

/** Default question settings */
export const QUESTION_DEFAULTS = {
  TIME_LIMIT_SEC: 20,
  MIN_TIME_LIMIT: 5,
  MAX_TIME_LIMIT: 120,
  POINTS: 1000,
  OPTIONS_COUNT: 4,
} as const;

/** PIN format */
export const PIN = {
  LENGTH: 6,
  PATTERN: /^\d{6}$/,
} as const;

/** Realtime channel prefixes */
export const CHANNELS = {
  SESSION: "session",       // session:{id}
  PRESENCE: "presence",     // presence:{id}
} as const;

/** Answer option colors (Kahoot-style) */
export const OPTION_COLORS = [
  { bg: "#E21B3C", name: "red", shape: "▲" },
  { bg: "#1368CE", name: "blue", shape: "◆" },
  { bg: "#D89E00", name: "yellow", shape: "●" },
  { bg: "#26890C", name: "green", shape: "■" },
] as const;

/** Leaderboard medals */
export const MEDALS = ["🥇", "🥈", "🥉"] as const;
