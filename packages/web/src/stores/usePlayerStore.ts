// ─────────────────────────────────────────────────────────────
// QuizArena — Player Store (Zustand)
// Central state for the live game session (player side).
// ─────────────────────────────────────────────────────────────

"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { calculateScore } from "@quizarena/shared";
import type {
  Session,
  SessionPlayer,
  QuestionSnapshot,
  LeaderboardEntry,
} from "@quizarena/shared";

// ─── Persisted player identity ──────────────────────────────

const STORAGE_KEY = "quizarena_player";

interface StoredPlayer {
  playerId: string;
  sessionId: string;
  nickname: string;
  avatar: string;
}

function savePlayerIdentity(data: StoredPlayer) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function loadPlayerIdentity(): StoredPlayer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Avatars ─────────────────────────────────────────────────

const AVATARS = ["🦊", "🐼", "🦁", "🐸", "🐱", "🐶", "🦄", "🐙", "🦋", "🐧", "🐨", "🦈"];

export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

// ─── Store ───────────────────────────────────────────────────

interface PlayerState {
  // Identity
  playerId: string | null;
  nickname: string;
  avatar: string;

  // Session
  session: Session | null;
  currentQuestion: QuestionSnapshot | null;
  players: SessionPlayer[];
  leaderboard: LeaderboardEntry[];

  // Answer state
  selectedOption: number | null;
  answerResult: {
    isCorrect: boolean;
    correctIndex: number;
    pointsAwarded: number;
    totalScore: number;
    streak: number;
  } | null;
  questionStartTime: number | null;
  hasAnswered: boolean;

  // Timer
  timeLeft: number;
  _timerInterval: ReturnType<typeof setInterval> | null;

  // Player score tracking
  totalScore: number;
  streak: number;
  rank: number | null;

  // Actions
  joinSession: (pin: string, nickname: string) => Promise<string>;
  rejoinSession: () => Promise<boolean>;
  submitAnswer: (optionIndex: number) => Promise<void>;
  setSession: (session: Session) => void;
  setLeaderboard: (rankings: LeaderboardEntry[]) => void;
  setTimeLeft: (t: number) => void;
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  addPlayer: (player: SessionPlayer) => void;
  removePlayer: (playerId: string) => void;
  setPlayers: (players: SessionPlayer[]) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  playerId: null,
  nickname: "",
  avatar: randomAvatar(),
  session: null,
  currentQuestion: null,
  players: [],
  leaderboard: [],
  selectedOption: null,
  answerResult: null,
  questionStartTime: null,
  hasAnswered: false,
  timeLeft: 0,
  _timerInterval: null,
  totalScore: 0,
  streak: 0,
  rank: null,

  // ─── Join via PIN ──────────────────────────────────────────

  joinSession: async (pin, nickname) => {
    const supabase = createClient();

    // Find session by PIN
    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .select("*")
      .eq("pin", pin)
      .in("status", ["lobby", "question_active"])
      .single();

    if (sessionErr || !session) {
      throw new Error("Game not found — check the PIN and try again.");
    }

    const avatar = get().avatar;

    // Insert as player
    const { data: player, error: playerErr } = await supabase
      .from("session_players")
      .insert({
        session_id: session.id,
        nickname,
        avatar,
        score: 0,
        streak: 0,
      })
      .select()
      .single();

    if (playerErr) {
      if (playerErr.code === "23505") {
        throw new Error("That nickname is already taken — choose another.");
      }
      throw new Error(playerErr.message || "Failed to join game.");
    }

    // Fetch all players
    const { data: allPlayers } = await supabase
      .from("session_players")
      .select("*")
      .eq("session_id", session.id)
      .order("score", { ascending: false });

    // Save identity for reconnect
    savePlayerIdentity({
      playerId: player.id,
      sessionId: session.id,
      nickname,
      avatar,
    });

    set({
      playerId: player.id,
      nickname,
      avatar,
      session: session as Session,
      players: (allPlayers as SessionPlayer[]) || [],
      currentQuestion:
        session.questions_snapshot?.[session.current_q_index] || null,
      questionStartTime:
        session.status === "question_active" ? Date.now() : null,
      hasAnswered: false,
      selectedOption: null,
      answerResult: null,
    });

    return session.id;
  },

  // ─── Rejoin from localStorage ──────────────────────────────

  rejoinSession: async () => {
    const stored = loadPlayerIdentity();
    if (!stored) return false;

    const supabase = createClient();

    // Check session still active
    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", stored.sessionId)
      .single();

    if (!session || session.status === "finished") {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    // Check player still exists
    const { data: player } = await supabase
      .from("session_players")
      .select("*")
      .eq("id", stored.playerId)
      .single();

    if (!player) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    // Check if already answered current question
    const { data: existingAnswer } = await supabase
      .from("player_answers")
      .select("id")
      .eq("session_id", session.id)
      .eq("player_id", stored.playerId)
      .eq("question_index", session.current_q_index)
      .maybeSingle();

    const { data: allPlayers } = await supabase
      .from("session_players")
      .select("*")
      .eq("session_id", session.id)
      .order("score", { ascending: false });

    set({
      playerId: stored.playerId,
      nickname: stored.nickname,
      avatar: stored.avatar,
      session: session as Session,
      players: (allPlayers as SessionPlayer[]) || [],
      currentQuestion:
        session.questions_snapshot?.[session.current_q_index] || null,
      totalScore: player.score ?? 0,
      streak: player.streak ?? 0,
      hasAnswered: !!existingAnswer,
      questionStartTime:
        session.status === "question_active" && !existingAnswer
          ? Date.now()
          : null,
    });

    return true;
  },

  // ─── Submit Answer ─────────────────────────────────────────

  submitAnswer: async (optionIndex) => {
    const { session, playerId, questionStartTime, streak } = get();
    if (!session || !playerId) return;

    const question = session.questions_snapshot?.[session.current_q_index];
    if (!question) return;

    const timeTakenMs = questionStartTime
      ? Date.now() - questionStartTime
      : question.time_limit_sec * 1000;

    const isCorrect = question.options[optionIndex]?.is_correct ?? false;
    const correctIndex = question.options.findIndex((o) => o.is_correct);

    // Calculate score
    const result = calculateScore({
      maxPoints: question.points,
      timeTakenMs,
      timeLimitSec: question.time_limit_sec,
      isCorrect,
      currentStreak: streak,
    });

    set({
      selectedOption: optionIndex,
      hasAnswered: true,
      answerResult: {
        isCorrect,
        correctIndex,
        pointsAwarded: result.points,
        totalScore: get().totalScore + result.points,
        streak: result.newStreak,
      },
      totalScore: get().totalScore + result.points,
      streak: result.newStreak,
    });

    // Persist to DB
    const supabase = createClient();

    await supabase.from("player_answers").insert({
      session_id: session.id,
      player_id: playerId,
      question_index: session.current_q_index,
      selected_option: optionIndex,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
      points_awarded: result.points,
    });

    // Update player score
    await supabase
      .from("session_players")
      .update({
        score: get().totalScore,
        streak: result.newStreak,
      })
      .eq("id", playerId);
  },

  // ─── Session Updates (from realtime) ───────────────────────

  setSession: (session) => {
    const prev = get().session;
    const q = session.questions_snapshot?.[session.current_q_index] || null;

    // Reset answer state when question changes
    const questionChanged =
      prev?.current_q_index !== session.current_q_index ||
      (prev?.status !== "question_active" &&
        session.status === "question_active");

    set({
      session,
      currentQuestion: q,
      ...(questionChanged
        ? {
            hasAnswered: false,
            selectedOption: null,
            answerResult: null,
            questionStartTime:
              session.status === "question_active" ? Date.now() : null,
          }
        : {}),
    });
  },

  setLeaderboard: (rankings) => {
    const playerId = get().playerId;
    const me = rankings.find((r) => r.player_id === playerId);
    set({
      leaderboard: rankings,
      rank: me?.rank ?? null,
    });
  },

  setTimeLeft: (t) => set({ timeLeft: t }),

  startTimer: (seconds) => {
    const { stopTimer } = get();
    stopTimer();
    set({ timeLeft: seconds });
    const interval = setInterval(() => {
      const current = get().timeLeft;
      if (current <= 0) {
        clearInterval(interval);
        return;
      }
      set({ timeLeft: current - 1 });
    }, 1000);
    set({ _timerInterval: interval });
  },

  stopTimer: () => {
    const interval = get()._timerInterval;
    if (interval) clearInterval(interval);
    set({ _timerInterval: null });
  },

  addPlayer: (player) =>
    set((s) => ({ players: [...s.players, player] })),

  removePlayer: (playerId) =>
    set((s) => ({
      players: s.players.filter((p) => p.id !== playerId),
    })),

  setPlayers: (players) => set({ players }),

  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      playerId: null,
      nickname: "",
      avatar: randomAvatar(),
      session: null,
      currentQuestion: null,
      players: [],
      leaderboard: [],
      selectedOption: null,
      answerResult: null,
      questionStartTime: null,
      hasAnswered: false,
      timeLeft: 0,
      totalScore: 0,
      streak: 0,
      rank: null,
    });
  },
}));
