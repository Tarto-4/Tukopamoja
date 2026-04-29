// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA Mobile — Game Store (Zustand)
// Player-side game state management.
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { calculateScore, rankPlayers } from "@quizarena/shared";
import type {
  Session,
  SessionPlayer,
  QuestionSnapshot,
  LeaderboardEntry,
  SessionStatus,
} from "@quizarena/shared";

interface PlayerGameState {
  // Connection
  session: Session | null;
  playerId: string | null;
  nickname: string;

  // Game
  status: SessionStatus;
  currentQuestion: QuestionSnapshot | null;
  questionIndex: number;
  timeLeft: number;
  hasAnswered: boolean;
  lastResult: {
    isCorrect: boolean;
    points: number;
    streak: number;
    totalScore: number;
  } | null;
  leaderboard: LeaderboardEntry[];
  myRank: number;
  myScore: number;

  // Timer
  _timerRef: ReturnType<typeof setInterval> | null;
  timeLeftMs: number;

  // Actions
  joinSession: (pin: string, nickname: string) => Promise<boolean>;
  setStatus: (status: SessionStatus) => void;
  setQuestion: (q: QuestionSnapshot, index: number) => void;
  submitAnswer: (optionIndex: number, timeTakenMs: number) => Promise<void>;
  setLeaderboard: (rankings: LeaderboardEntry[]) => void;
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerGameState>((set, get) => ({
  session: null,
  playerId: null,
  nickname: "",
  status: "lobby",
  currentQuestion: null,
  questionIndex: -1,
  timeLeft: 0,
  hasAnswered: false,
  lastResult: null,
  leaderboard: [],
  myRank: 0,
  myScore: 0,
  _timerRef: null,
  timeLeftMs: 0,

  joinSession: async (pin, nickname) => {
    // 1. Look up session by PIN
    const { data: session, error: sErr } = await supabase
      .from("sessions")
      .select("*")
      .eq("pin", pin)
      .neq("status", "finished")
      .single();

    if (sErr || !session) return false;

    // 2. Register as a player
    const { data: player, error: pErr } = await supabase
      .from("session_players")
      .insert({
        session_id: session.id,
        nickname,
        avatar: ["🎮", "🎯", "🚀", "⭐", "🎨", "🎵", "🌟", "💡"][
          Math.floor(Math.random() * 8)
        ],
      })
      .select()
      .single();

    if (pErr || !player) return false;

    // 3. Increment player_count on session
    await supabase
      .from("sessions")
      .update({ player_count: session.player_count + 1 })
      .eq("id", session.id);

    set({
      session: session as Session,
      playerId: player.id,
      nickname,
      status: session.status as SessionStatus,
    });

    return true;
  },

  setStatus: (status) => set({ status }),

  setQuestion: (q, index) =>
    set({
      currentQuestion: q,
      questionIndex: index,
      hasAnswered: false,
      lastResult: null,
    }),

  submitAnswer: async (optionIndex, timeTakenMs) => {
    const { session, playerId, questionIndex, currentQuestion } = get();
    if (!session || !playerId || !currentQuestion) return;

    const isCorrect = currentQuestion.options[optionIndex]?.is_correct || false;

    // Get current player data for streak
    const { data: playerData } = await supabase
      .from("session_players")
      .select("score, streak")
      .eq("id", playerId)
      .single();

    const currentStreak = playerData?.streak || 0;
    const currentScore = playerData?.score || 0;

    const { count: existingAnswersCount } = await supabase
      .from("player_answers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("question_index", questionIndex);

    const answerRank = (existingAnswersCount ?? 0) + 1;
    const activePlayers = Math.max(1, session.player_count || 1);

    // Calculate score
    const result = calculateScore({
      maxPoints: currentQuestion.points,
      timeTakenMs,
      timeLimitSec: currentQuestion.time_limit_sec,
      isCorrect,
      answerRank,
      activePlayers,
      currentStreak,
    });

    const newTotalScore = currentScore + result.points;

    // Insert answer record
    await supabase.from("player_answers").insert({
      session_id: session.id,
      player_id: playerId,
      question_index: questionIndex,
      selected_option: optionIndex,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
      points_awarded: result.points,
    });

    // Update player score & streak
    await supabase
      .from("session_players")
      .update({
        score: newTotalScore,
        streak: result.newStreak,
      })
      .eq("id", playerId);

    set({
      hasAnswered: true,
      myScore: newTotalScore,
      lastResult: {
        isCorrect,
        points: result.points,
        streak: result.newStreak,
        totalScore: newTotalScore,
      },
    });
  },

  setLeaderboard: (rankings) => {
    const playerId = get().playerId;
    const me = rankings.find((r) => r.player_id === playerId);
    set({
      leaderboard: rankings,
      myRank: me?.rank || 0,
      myScore: me?.score || get().myScore,
    });
  },

  startTimer: (seconds) => {
    get().stopTimer();
    const endsAt = Date.now() + Math.max(0, seconds * 1000);

    const updateTimer = () => {
      const remainingMs = Math.max(0, endsAt - Date.now());
      set({
        timeLeftMs: remainingMs,
        timeLeft: Math.ceil(remainingMs / 1000),
      });
    };

    updateTimer();

    const interval = setInterval(() => {
      const remainingMs = Math.max(0, endsAt - Date.now());
      if (remainingMs <= 0) {
        clearInterval(interval);
        set({ timeLeft: 0, timeLeftMs: 0, _timerRef: null });
        return;
      }
      set({
        timeLeftMs: remainingMs,
        timeLeft: Math.ceil(remainingMs / 1000),
      });
    }, 100);
    set({ _timerRef: interval });
  },

  stopTimer: () => {
    const ref = get()._timerRef;
    if (ref) clearInterval(ref);
    set({ _timerRef: null });
  },

  reset: () =>
    set({
      session: null,
      playerId: null,
      nickname: "",
      status: "lobby",
      currentQuestion: null,
      questionIndex: -1,
      timeLeft: 0,
      timeLeftMs: 0,
      hasAnswered: false,
      lastResult: null,
      leaderboard: [],
      myRank: 0,
      myScore: 0,
    }),
}));
