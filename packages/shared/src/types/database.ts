// ─────────────────────────────────────────────────────────────
// Tokupojomo — Database Types (mirrors Supabase schema)
// Run `npm run db:types` from root to auto-generate from live DB.
// These manual types serve as the dev-time contract.
// ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "host";
  created_at: string;
}

export interface Template {
  id: string;
  created_by: string;
  title: string;
  description: string;
  cover_image: string | null;
  is_published: boolean;
  question_count: number;
  play_count: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  text: string;
  is_correct: boolean;
}

export type QuestionType = "multiple_choice" | "true_false";

export interface Question {
  id: string;
  template_id: string;
  question_text: string;
  question_type: QuestionType;
  image_url: string | null;
  time_limit_sec: number;
  points: number;
  sort_order: number;
  options: QuestionOption[];
  created_at: string;
}

/** Snapshot stored in sessions.questions_snapshot */
export interface QuestionSnapshot {
  question_text: string;
  question_type: QuestionType;
  image_url: string | null;
  time_limit_sec: number;
  points: number;
  options: QuestionOption[];
}

export type SessionStatus =
  | "lobby"
  | "question_active"
  | "evaluating"
  | "leaderboard"
  | "finished";

export interface Session {
  id: string;
  template_id: string;
  host_id: string;
  pin: string;
  status: SessionStatus;
  current_q_index: number;
  player_count: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  questions_snapshot: QuestionSnapshot[] | null;
  lobby_locked: boolean;
  allow_late_join: boolean;
  is_paused: boolean;
  current_question_started_at: string | null;
  current_question_time_limit_sec: number | null;
  current_question_remaining_sec: number | null;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  nickname: string;
  email: string | null;
  avatar: string;
  score: number;
  streak: number;
  rank: number | null;
  joined_at: string;
  is_ready: boolean;
  ready_at: string | null;
  is_muted: boolean;
  kicked_at: string | null;
}

export interface PlayerAnswer {
  id: string;
  session_id: string;
  player_id: string;
  question_index: number;
  selected_option: number;
  is_correct: boolean;
  time_taken_ms: number;
  points_awarded: number;
  answered_at: string;
}
