// ─────────────────────────────────────────────────────────────
// QuizArena — Game Store (Zustand)
// Central state for the live game session (host side).
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type {
  Session,
  SessionPlayer,
  QuestionSnapshot,
  LeaderboardEntry,
} from "@quizarena/shared";

interface GameState {
  // Session
  session: Session | null;
  players: SessionPlayer[];
  currentQuestion: QuestionSnapshot | null;
  leaderboard: LeaderboardEntry[];
  answeredCount: number;
  answerDistribution: number[];
  timeLeft: number;

  // Timer
  _timerInterval: ReturnType<typeof setInterval> | null;

  // Actions
  loadSession: (sessionId: string) => Promise<void>;
  setSession: (session: Session) => void;
  addPlayer: (player: SessionPlayer) => void;
  removePlayer: (playerId: string) => void;
  setPlayers: (players: SessionPlayer[]) => void;
  incrementAnswered: (selectedOption?: number) => void;
  setLeaderboard: (rankings: LeaderboardEntry[]) => void;
  setTimeLeft: (t: number) => void;
  startTimer: (seconds: number, onExpiry?: () => void) => void;
  stopTimer: () => void;
  fetchAndBroadcastLeaderboard: (eventType: "LEADERBOARD" | "GAME_OVER") => Promise<void>;

  // Host commands (mutate DB → triggers realtime)
  startGame: () => Promise<void>;
  nextQuestion: () => Promise<void>;
  showLeaderboard: () => Promise<void>;
  endGame: () => Promise<void>;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  session: null,
  players: [],
  currentQuestion: null,
  leaderboard: [],
  answeredCount: 0,
  answerDistribution: [],
  timeLeft: 0,
  _timerInterval: null,

  loadSession: async (sessionId) => {
    const supabase = createClient();

    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) return;

    const { data: players } = await supabase
      .from("session_players")
      .select("*")
      .eq("session_id", sessionId)
      .order("score", { ascending: false });

    set({
      session: session as Session,
      players: (players as SessionPlayer[]) || [],
      currentQuestion:
        session.questions_snapshot?.[session.current_q_index] || null,
    });
  },

  setSession: (session) => {
    const snapshot = session.questions_snapshot;
    const q = snapshot?.[session.current_q_index] || null;
    set({ session, currentQuestion: q, answeredCount: 0 });
  },

  addPlayer: (player) =>
    set((s) => ({
      players: [...s.players, player],
    })),

  removePlayer: (playerId) =>
    set((s) => ({
      players: s.players.filter((p) => p.id !== playerId),
    })),

  setPlayers: (players) => set({ players }),

  incrementAnswered: (selectedOption?: number) =>
    set((s) => {
      const dist = [...s.answerDistribution];
      if (selectedOption !== undefined && selectedOption >= 0) {
        while (dist.length <= selectedOption) dist.push(0);
        dist[selectedOption]++;
      }
      return { answeredCount: s.answeredCount + 1, answerDistribution: dist };
    }),

  setLeaderboard: (rankings) => set({ leaderboard: rankings }),

  setTimeLeft: (t) => set({ timeLeft: t }),

  startTimer: (seconds, onExpiry) => {
    const { stopTimer } = get();
    stopTimer();

    set({ timeLeft: seconds });
    const interval = setInterval(() => {
      const current = get().timeLeft;
      if (current <= 1) {
        clearInterval(interval);
        set({ timeLeft: 0, _timerInterval: null });
        if (onExpiry) onExpiry();
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

  // ─── Host Commands ────────────────────────────────────────
  // These mutate the sessions table. Supabase Realtime broadcasts
  // the change to all subscribers (host + players).

  fetchAndBroadcastLeaderboard: async (eventType) => {
    const session = get().session;
    if (!session) return;

    const supabase = createClient();

    // Fetch ranked players
    const { data: players } = await supabase
      .from("session_players")
      .select("*")
      .eq("session_id", session.id)
      .order("score", { ascending: false });

    const rankings: LeaderboardEntry[] = (players || []).map((p, i) => ({
      player_id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score ?? 0,
      streak: p.streak ?? 0,
      rank: i + 1,
    }));

    // Set locally
    set({ leaderboard: rankings, players: (players as SessionPlayer[]) || [] });

    // Broadcast to all connected clients
    const channel = supabase.channel(`session:${session.id}`);
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "game_event",
      payload: eventType === "GAME_OVER"
        ? { type: "GAME_OVER", payload: { final_rankings: rankings } }
        : { type: "LEADERBOARD", payload: { rankings } },
    });
    channel.unsubscribe();
  },

  startGame: async () => {
    const session = get().session;
    if (!session) return;

    const supabase = createClient();
    const startedAt = new Date().toISOString();
    const { error } = await supabase
      .from("sessions")
      .update({
        status: "question_active",
        current_q_index: 0,
        started_at: startedAt,
      })
      .eq("id", session.id);

    if (error) throw error;

    set((s) => {
      if (!s.session) return s;
      return {
        ...s,
        session: {
          ...s.session,
          status: "question_active",
          current_q_index: 0,
          started_at: startedAt,
        },
        currentQuestion: s.session.questions_snapshot?.[0] || null,
        answeredCount: 0,
        answerDistribution: [],
      };
    });
  },

  nextQuestion: async () => {
    const session = get().session;
    if (!session) return;

    const total = session.questions_snapshot?.length || 0;
    const next = session.current_q_index + 1;

    const supabase = createClient();

    if (next >= total) {
      // End game
      const endedAt = new Date().toISOString();
      const { error } = await supabase
        .from("sessions")
        .update({
          status: "finished",
          ended_at: endedAt,
        })
        .eq("id", session.id);

      if (error) throw error;

      set((s) => {
        if (!s.session) return s;
        return {
          ...s,
          session: {
            ...s.session,
            status: "finished",
            ended_at: endedAt,
          },
        };
      });
    } else {
      const { error } = await supabase
        .from("sessions")
        .update({
          status: "question_active",
          current_q_index: next,
        })
        .eq("id", session.id);

      if (error) throw error;

      set((s) => {
        if (!s.session) return s;
        return {
          ...s,
          session: {
            ...s.session,
            status: "question_active",
            current_q_index: next,
          },
          currentQuestion: s.session.questions_snapshot?.[next] || null,
          answeredCount: 0,
          answerDistribution: [],
        };
      });
    }
  },

  showLeaderboard: async () => {
    const session = get().session;
    if (!session) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ status: "leaderboard" })
      .eq("id", session.id);

    if (error) throw error;

    set((s) => {
      if (!s.session) return s;
      return {
        ...s,
        session: {
          ...s.session,
          status: "leaderboard",
        },
      };
    });

    // Fetch scores and broadcast to all clients
    await get().fetchAndBroadcastLeaderboard("LEADERBOARD");
  },

  endGame: async () => {
    const session = get().session;
    if (!session) return;

    const supabase = createClient();
    const endedAt = new Date().toISOString();
    const { error } = await supabase
      .from("sessions")
      .update({
        status: "finished",
        ended_at: endedAt,
      })
      .eq("id", session.id);

    if (error) throw error;

    set((s) => {
      if (!s.session) return s;
      return {
        ...s,
        session: {
          ...s.session,
          status: "finished",
          ended_at: endedAt,
        },
      };
    });

    // Fetch final scores and broadcast to all clients
    await get().fetchAndBroadcastLeaderboard("GAME_OVER");
  },

  reset: () =>
    set({
      session: null,
      players: [],
      currentQuestion: null,
      leaderboard: [],
      answeredCount: 0,
      answerDistribution: [],
      timeLeft: 0,
    }),
}));
