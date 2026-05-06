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

/** Answer option colors — vivid, WCAG-contrast-aware */
export const OPTION_COLORS = [
  { bg: "#E8003E", text: "#ffffff", glow: "rgba(232,0,62,0.55)",  name: "red",    shape: "▲" },
  { bg: "#0A62FF", text: "#ffffff", glow: "rgba(10,98,255,0.55)", name: "blue",   shape: "◆" },
  { bg: "#FF9F00", text: "#1a1200", glow: "rgba(255,159,0,0.55)", name: "yellow", shape: "●" },
  { bg: "#00A854", text: "#ffffff", glow: "rgba(0,168,84,0.55)",  name: "green",  shape: "■" },
] as const;

/** Leaderboard medals */
export const MEDALS = ["🥇", "🥈", "🥉"] as const;
