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

  // Realtime health
  realtimeStatus: "connected" | "connecting" | "reconnecting" | "disconnected";

  // Actions
  joinSession: (pin: string, nickname: string, email: string) => Promise<string>;
  rejoinSession: () => Promise<boolean>;
  toggleReady: (ready: boolean) => Promise<void>;
  submitAnswer: (optionIndex: number) => Promise<void>;
  setSession: (session: Session) => void;
  setLeaderboard: (rankings: LeaderboardEntry[]) => void;
  setRealtimeStatus: (status: "connected" | "connecting" | "reconnecting" | "disconnected") => void;
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
  realtimeStatus: "connecting",

  // ─── Join via PIN ──────────────────────────────────────────

  joinSession: async (pin, nickname, email) => {
    const supabase = createClient();

    // Find session by PIN first (for hydration); guarded join RPC enforces controls.
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

    const { data: joinData, error: joinErr } = await supabase.rpc("join_session_guarded", {
      p_pin: pin,
      p_nickname: nickname,
      p_email: email,
      p_avatar: avatar,
    });

    if (joinErr || !joinData || joinData.length === 0) {
      const msg = joinErr?.message || "Failed to join game.";
      if (msg.toLowerCase().includes("nickname") || joinErr?.code === "23505") {
        throw new Error("That nickname is already taken — choose another.");
      }
      throw new Error(msg);
    }

    const joinRow = joinData[0] as { session_id: string; player_id: string };

    // Fetch joined player + current players
    const { data: player } = await supabase
      .from("session_players")
      .select("*")
      .eq("id", joinRow.player_id)
      .single();

    const { data: allPlayers } = await supabase
      .from("session_players")
      .select("*")
      .eq("session_id", joinRow.session_id)
      .is("kicked_at", null)
      .order("score", { ascending: false });

    // Save identity for reconnect
    savePlayerIdentity({
      playerId: joinRow.player_id,
      sessionId: joinRow.session_id,
      nickname,
      avatar,
    });

    set({
      playerId: joinRow.player_id,
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

    return joinRow.session_id;
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

  // ─── Ready state in lobby ─────────────────────────────────

  toggleReady: async (ready) => {
    const { session, playerId } = get();
    if (!session || !playerId) return;

    const supabase = createClient();
    await supabase
      .from("session_players")
      .update({ is_ready: ready, ready_at: ready ? new Date().toISOString() : null })
      .eq("id", playerId)
      .eq("session_id", session.id);

    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, is_ready: ready, ready_at: ready ? new Date().toISOString() : null } : p
      ),
    }));
  },

  // ─── Submit Answer ─────────────────────────────────────────

  submitAnswer: async (optionIndex) => {
    const { session, playerId, questionStartTime, streak, players } = get();
    if (!session || !playerId) return;

    const me = players.find((p) => p.id === playerId);
    if (me?.kicked_at) throw new Error("You were removed from this session.");
    if (me?.is_muted) throw new Error("You are muted and cannot answer right now.");

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

  setRealtimeStatus: (status) => set({ realtimeStatus: status }),

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
      realtimeStatus: "disconnected",
    });
  },
}));
