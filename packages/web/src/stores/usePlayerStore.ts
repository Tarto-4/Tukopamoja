// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Player Store (Zustand)
// Central state for the live game session (player side).
// ─────────────────────────────────────────────────────────────

"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { clearSessionQueryCache } from "@/lib/query-cache";
import { calculateScore } from "@tukopamoja/shared";
import type {
  Session,
  SessionPlayer,
  QuestionSnapshot,
  LeaderboardEntry,
} from "@tukopamoja/shared";

// ─── Persisted player identity ──────────────────────────────

const STORAGE_KEY = "tukopamoja_player";

interface StoredPlayer {
  playerId: string;
  sessionId: string;
  firstName: string;
  lastName: string;
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
  firstName: string;
  lastName: string;
  /** Display name (first + last) */
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
  timeLeftMs: number;
  _timerInterval: ReturnType<typeof setInterval> | null;
  _timerEndsAt: number | null;

  // Player score tracking
  totalScore: number;
  streak: number;
  rank: number | null;

  // Realtime health
  realtimeStatus: "connected" | "connecting" | "reconnecting" | "disconnected";

  // Actions
  joinSession: (pin: string, firstName: string, lastName: string, email: string) => Promise<string>;
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
  firstName: "",
  lastName: "",
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
  timeLeftMs: 0,
  _timerInterval: null,
  _timerEndsAt: null,
  totalScore: 0,
  streak: 0,
  rank: null,
  realtimeStatus: "connecting",

  // ─── Join via PIN ──────────────────────────────────────────

  joinSession: async (pin, firstName, lastName, email) => {
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
    const displayName = `${firstName} ${lastName}`;

    const { data: joinData, error: joinErr } = await supabase.rpc("join_session_guarded", {
      p_pin: pin,
      p_first_name: firstName,
      p_last_name: lastName,
      p_email: email,
      p_avatar: avatar,
    });

    if (joinErr || !joinData || joinData.length === 0) {
      const msg = joinErr?.message || "Failed to join game.";
      if (msg.toLowerCase().includes("name") || joinErr?.code === "23505") {
        throw new Error("That name is already taken in this session — try a variation.");
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
      firstName,
      lastName,
      avatar,
    });

    set({
      playerId: joinRow.player_id,
      firstName,
      lastName,
      nickname: displayName,
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

    // Fetch session + player in parallel (latency optimisation)
    const [sessionRes, playerRes] = await Promise.all([
      supabase.from("sessions").select("*").eq("id", stored.sessionId).single(),
      supabase.from("session_players").select("*").eq("id", stored.playerId).is("kicked_at", null).single(),
    ]);

    const session = sessionRes.data;
    const player = playerRes.data;

    if (!session || session.status === "finished" || !player) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    // Fetch answer + all players in parallel
    const [answerRes, allPlayersRes] = await Promise.all([
      supabase.from("player_answers").select("*")
        .eq("session_id", session.id).eq("player_id", stored.playerId)
        .eq("question_index", session.current_q_index).maybeSingle(),
      supabase.from("session_players").select("*")
        .eq("session_id", session.id).is("kicked_at", null)
        .order("score", { ascending: false }),
    ]);

    const existingAnswer = answerRes.data;
    const allPlayers = allPlayersRes.data;

    // ── Calculate correct questionStartTime from DB timestamp ──
    const question = session.questions_snapshot?.[session.current_q_index] || null;
    let questionStartTime: number | null = null;
    if (session.status === "question_active" && !existingAnswer) {
      if (session.current_question_started_at) {
        questionStartTime = new Date(session.current_question_started_at).getTime();
      } else {
        questionStartTime = Date.now();
      }
    }

    // ── Restore answer result if player already answered ──
    let restoredAnswerResult: PlayerState["answerResult"] = null;
    let restoredSelectedOption: number | null = null;
    if (existingAnswer && question) {
      const correctIndex = question.options.findIndex((o: { is_correct: boolean }) => o.is_correct);
      restoredSelectedOption = existingAnswer.selected_option;
      restoredAnswerResult = {
        isCorrect: existingAnswer.is_correct,
        correctIndex,
        pointsAwarded: existingAnswer.points_awarded,
        totalScore: player.score ?? 0,
        streak: player.streak ?? 0,
      };
    }

    // ── Reconstruct leaderboard for leaderboard / finished states ──
    let leaderboard: LeaderboardEntry[] = [];
    let rank: number | null = null;
    if (
      (session.status === "leaderboard" || session.status === "evaluating") &&
      allPlayers
    ) {
      leaderboard = (allPlayers as SessionPlayer[]).map((p, i) => ({
        player_id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        nickname: p.nickname || `${p.first_name} ${p.last_name}`,
        avatar: p.avatar,
        score: p.score,
        streak: p.streak,
        rank: i + 1,
      }));
      const me = leaderboard.find((r) => r.player_id === stored.playerId);
      rank = me?.rank ?? null;
    }

    set({
      playerId: stored.playerId,
      firstName: stored.firstName,
      lastName: stored.lastName,
      nickname: `${stored.firstName} ${stored.lastName}`,
      avatar: stored.avatar,
      session: session as Session,
      players: (allPlayers as SessionPlayer[]) || [],
      currentQuestion: question,
      totalScore: player.score ?? 0,
      streak: player.streak ?? 0,
      hasAnswered: !!existingAnswer,
      selectedOption: restoredSelectedOption,
      answerResult: restoredAnswerResult,
      questionStartTime,
      leaderboard,
      rank,
    });

    // ── Start timer with correct remaining seconds ──
    if (session.status === "question_active" && !existingAnswer && question) {
      const limitSec =
        session.current_question_time_limit_sec ||
        question.time_limit_sec;
      let remainingSec = limitSec;
      if (session.current_question_started_at) {
        const elapsedMs = Date.now() - new Date(session.current_question_started_at).getTime();
        remainingSec = Math.max(0, limitSec - Math.floor(elapsedMs / 1000));
      }
      if (remainingSec > 0) {
        get().startTimer(remainingSec);
      }
    }

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
    const { session, playerId, questionStartTime, streak, players, hasAnswered } = get();
    if (!session || !playerId) return;
    if (hasAnswered) return; // Prevent double-submit

    // Mark as answered immediately to prevent concurrent submissions
    set({ hasAnswered: true, selectedOption: optionIndex });

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

    const supabase = createClient();

    const { count: existingAnswersCount } = await supabase
      .from("player_answers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("question_index", session.current_q_index);

    const answerRank = (existingAnswersCount ?? 0) + 1;
    const activePlayers = Math.max(1, session.player_count || players.length || 1);

    // Calculate score
    const result = calculateScore({
      maxPoints: question.points,
      timeTakenMs,
      timeLimitSec: question.time_limit_sec,
      isCorrect,
      answerRank,
      activePlayers,
      currentStreak: streak,
    });

    const newTotalScore = get().totalScore + result.points;

    set({
      answerResult: {
        isCorrect,
        correctIndex,
        pointsAwarded: result.points,
        totalScore: newTotalScore,
        streak: result.newStreak,
      },
      totalScore: newTotalScore,
      streak: result.newStreak,
    });

    // Persist answer + updated score to DB in parallel
    const [insertRes, updateRes] = await Promise.all([
      supabase.from("player_answers").insert({
        session_id: session.id,
        player_id: playerId,
        question_index: session.current_q_index,
        selected_option: optionIndex,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
        points_awarded: result.points,
      }),
      supabase.from("session_players").update({
        score: get().totalScore,
        streak: result.newStreak,
      }).eq("id", playerId),
    ]);

    if (insertRes.error) {
      console.error("[TUKOPAMOJA] Failed to save answer:", insertRes.error.message);
    }
    if (updateRes.error) {
      console.error("[TUKOPAMOJA] Failed to update score:", updateRes.error.message);
    }
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
      // Sync totalScore from the authoritative server-side score
      // to correct any client-side drift (rounding, race conditions).
      ...(me ? { totalScore: me.score } : {}),
    });
  },

  setRealtimeStatus: (status) => set({ realtimeStatus: status }),

  setTimeLeft: (t) => set({ timeLeft: t, timeLeftMs: Math.max(0, t * 1000) }),

  startTimer: (seconds) => {
    const { stopTimer } = get();
    stopTimer();

    const now = Date.now();
    const endsAt = now + Math.max(0, seconds * 1000);

    const updateTimer = () => {
      const remainingMs = Math.max(0, endsAt - Date.now());
      const remainingSec = Math.ceil(remainingMs / 1000);
      set({ timeLeftMs: remainingMs, timeLeft: remainingSec });
    };

    updateTimer();

    const interval = setInterval(() => {
      const remainingMs = Math.max(0, endsAt - Date.now());
      if (remainingMs <= 0) {
        clearInterval(interval);
        set({ timeLeft: 0, timeLeftMs: 0, _timerInterval: null, _timerEndsAt: null });
        return;
      }
      set({ timeLeftMs: remainingMs, timeLeft: Math.ceil(remainingMs / 1000) });
    }, 100);
    set({ _timerInterval: interval, _timerEndsAt: endsAt });
  },

  stopTimer: () => {
    const interval = get()._timerInterval;
    if (interval) clearInterval(interval);
    set({ _timerInterval: null, _timerEndsAt: null });
  },

  addPlayer: (player) =>
    set((s) => ({
      players: s.players.some((p) => p.id === player.id) ? s.players : [...s.players, player],
    })),

  removePlayer: (playerId) =>
    set((s) => ({
      players: s.players.filter((p) => p.id !== playerId),
    })),

  setPlayers: (players) => set({ players }),

  reset: () => {
    get().stopTimer();
    localStorage.removeItem(STORAGE_KEY);
    clearSessionQueryCache();
    set({
      playerId: null,
      firstName: "",
      lastName: "",
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
      timeLeftMs: 0,
      totalScore: 0,
      streak: 0,
      rank: null,
      realtimeStatus: "disconnected",
      _timerInterval: null,
      _timerEndsAt: null,
    });
  },
}));
