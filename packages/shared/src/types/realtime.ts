// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Real-Time Event Types
// Defines the WebSocket channel schema bridging
// Next.js host ↔ Supabase Realtime ↔ React Native clients.
// ─────────────────────────────────────────────────────────────

import type { SessionStatus, QuestionSnapshot } from "./database";

// ┌────────────────────────────────────────────────────────────┐
// │ CHANNEL NAMING CONVENTION                                  │
// │                                                            │
// │  session:{sessionId}       — game-wide broadcasts          │
// │  session:{sessionId}:host  — host-only commands            │
// │  presence:{sessionId}      — player presence tracking      │
// └────────────────────────────────────────────────────────────┘

// ─── Host → All Players (Broadcast) ─────────────────────────

export interface GameStateEvent {
  type: "GAME_STATE";
  payload: {
    status: SessionStatus;
    current_q_index: number;
  };
}

export interface QuestionStartEvent {
  type: "QUESTION_START";
  payload: {
    index: number;
    question_text: string;
    image_url: string | null;
    options: string[]; // text only — no is_correct sent to players
    time_limit_sec: number;
    total_questions: number;
  };
}

export interface QuestionEndEvent {
  type: "QUESTION_END";
  payload: {
    correct_option_index: number;
    answer_distribution: number[]; // count per option
  };
}

export interface LeaderboardEvent {
  type: "LEADERBOARD";
  payload: {
    rankings: LeaderboardEntry[];
  };
}

export interface GameOverEvent {
  type: "GAME_OVER";
  payload: {
    final_rankings: LeaderboardEntry[];
  };
}

// ─── Player → Host (Broadcast) ──────────────────────────────

export interface PlayerJoinEvent {
  type: "PLAYER_JOIN";
  payload: {
    player_id: string;
    first_name: string;
    last_name: string;
    /** Display name (first + last) */
    nickname: string;
    avatar: string;
  };
}

export interface PlayerAnswerEvent {
  type: "PLAYER_ANSWER";
  payload: {
    player_id: string;
    question_index: number;
    selected_option: number;
    answer_text: string | null;
    time_taken_ms: number;
  };
}

export interface PlayerLeaveEvent {
  type: "PLAYER_LEAVE";
  payload: {
    player_id: string;
  };
}

// ─── Host → Server (via DB mutation, triggers broadcast) ────

export interface HostStartGameEvent {
  type: "HOST_START";
}

export interface HostNextQuestionEvent {
  type: "HOST_NEXT";
}

export interface HostShowLeaderboardEvent {
  type: "HOST_LEADERBOARD";
}

export interface HostEndGameEvent {
  type: "HOST_END";
}

// ─── Server → Individual Player (Direct) ────────────────────

export interface AnswerResultEvent {
  type: "ANSWER_RESULT";
  payload: {
    is_correct: boolean;
    correct_option_index: number;
    points_awarded: number;
    total_score: number;
    streak: number;
  };
}

// ─── Combined Types ─────────────────────────────────────────

export type BroadcastEvent =
  | GameStateEvent
  | QuestionStartEvent
  | QuestionEndEvent
  | LeaderboardEvent
  | GameOverEvent
  | PlayerJoinEvent
  | PlayerAnswerEvent
  | PlayerLeaveEvent;

export type HostCommand =
  | HostStartGameEvent
  | HostNextQuestionEvent
  | HostShowLeaderboardEvent
  | HostEndGameEvent;

// ─── Shared DTOs ─────────────────────────────────────────────

export interface LeaderboardEntry {
  player_id: string;
  first_name: string;
  last_name: string;
  /** Display name (first + last) */
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  rank: number;
}

export interface AnswerSummary {
  total_answers: number;
  correct_count: number;
  distribution: number[];
  avg_time_ms: number;
}
