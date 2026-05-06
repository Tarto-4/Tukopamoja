// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Game Store (Zustand)
// Central state for the live game session (host side).
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type {
  Session,
  SessionPlayer,
  QuestionSnapshot,
  LeaderboardEntry,
} from "@tukopamoja/shared";

interface GameState {
  session: Session | null;
  players: SessionPlayer[];
  currentQuestion: QuestionSnapshot | null;
  leaderboard: LeaderboardEntry[];
  answeredCount: number;
  answerDistribution: number[];
  timeLeft: number;
  realtimeStatus: "connected" | "connecting" | "reconnecting" | "disconnected";

  _timerInterval: ReturnType<typeof setInterval> | null;

  loadSession: (sessionId: string) => Promise<void>;
  setSession: (session: Session) => void;
  addPlayer: (player: SessionPlayer) => void;
  removePlayer: (playerId: string) => void;
  setPlayers: (players: SessionPlayer[]) => void;
  incrementAnswered: (selectedOption?: number) => void;
  setLeaderboard: (rankings: LeaderboardEntry[]) => void;
  setRealtimeStatus: (status: "connected" | "connecting" | "reconnecting" | "disconnected") => void;
  setTimeLeft: (t: number) => void;
  startTimer: (seconds: number, onExpiry?: () => void) => void;
  stopTimer: () => void;
  fetchAndBroadcastLeaderboard: (eventType: "LEADERBOARD" | "GAME_OVER", pageSize?: number) => Promise<void>;

  startGame: () => Promise<void>;
  nextQuestion: () => Promise<void>;
  showLeaderboard: () => Promise<void>;
  endGame: () => Promise<void>;
  pauseGame: () => Promise<void>;
  resumeGame: () => Promise<void>;
  setLobbyLocked: (locked: boolean) => Promise<void>;
  setLateJoin: (enabled: boolean) => Promise<void>;
  kickPlayer: (playerId: string) => Promise<void>;
  mutePlayer: (playerId: string, muted: boolean) => Promise<void>;
  reset: () => void;
}

async function logHostAction(sessionId: string, action: string, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = createClient();
    await supabase.rpc("log_host_action", {
      p_session_id: sessionId,
      p_action: action,
      p_metadata: metadata,
    });
  } catch (err) {
    console.warn("[TUKOPAMOJA] Failed to log host action:", action, err);
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  session: null,
  players: [],
  currentQuestion: null,
  leaderboard: [],
  answeredCount: 0,
  answerDistribution: [],
  timeLeft: 0,
  realtimeStatus: "connecting",
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
      .is("kicked_at", null)
      .order("score", { ascending: false });

    const s = session as Session;
    const q = s.questions_snapshot?.[s.current_q_index] || null;

    set({
      session: s,
      players: (players as SessionPlayer[]) || [],
      currentQuestion: q,
    });

    // ── Recover timer after browser refresh ──────────────────
    // When the session is mid-question the realtime UPDATE has
    // already fired before we reconnected, so the timer never
    // starts. Compute the remaining seconds from the DB
    // timestamp and kick the timer off ourselves.
    if (s.status === "question_active" && s.current_question_started_at) {
      const limitSec =
        s.current_question_remaining_sec ??
        s.current_question_time_limit_sec ??
        q?.time_limit_sec ??
        30;

      const elapsedMs = Date.now() - new Date(s.current_question_started_at).getTime();
      const remaining = Math.max(0, Math.ceil(limitSec - elapsedMs / 1000));

      if (remaining > 0) {
        get().startTimer(remaining);
      } else {
        set({ timeLeft: 0 });
      }
    }
  },

  setSession: (session) => {
    const snapshot = session.questions_snapshot;
    const q = snapshot?.[session.current_q_index] || null;
    const questionChanged = get().session?.current_q_index !== session.current_q_index;
    set({
      session,
      currentQuestion: q,
      answeredCount: questionChanged ? 0 : get().answeredCount,
      answerDistribution: questionChanged ? [] : get().answerDistribution,
    });
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
  setRealtimeStatus: (status) => set({ realtimeStatus: status }),
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

  fetchAndBroadcastLeaderboard: async (eventType, pageSize = 500) => {
    const session = get().session;
    if (!session) return;

    const supabase = createClient();
    const { data: leaderboardPage } = await supabase.rpc("get_leaderboard_page", {
      p_session_id: session.id,
      p_limit: pageSize,
      p_offset: 0,
    });

    interface LeaderboardRow {
      player_id: string;
      first_name?: string;
      last_name?: string;
      nickname?: string;
      avatar: string;
      score?: number;
      streak?: number;
      rank?: number;
    }

    const rankings: LeaderboardEntry[] = (leaderboardPage || []).map((p: LeaderboardRow) => ({
      player_id: p.player_id,
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      nickname: p.nickname || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
      avatar: p.avatar,
      score: p.score ?? 0,
      streak: p.streak ?? 0,
      rank: Number(p.rank),
    }));

    const { data: players } = await supabase
      .from("session_players")
      .select("*")
      .eq("session_id", session.id)
      .is("kicked_at", null)
      .order("score", { ascending: false });

    set({ leaderboard: rankings, players: (players as SessionPlayer[]) || [] });

    // Use a unique ephemeral channel to avoid conflicting with the main
    // realtime subscription managed by useRealtimeGame hook.
    const broadcastChannel = supabase.channel(`broadcast:${session.id}:${Date.now()}`);
    await broadcastChannel.subscribe();
    await broadcastChannel.send({
      type: "broadcast",
      event: "game_event",
      payload:
        eventType === "GAME_OVER"
          ? { type: "GAME_OVER", payload: { final_rankings: rankings } }
          : { type: "LEADERBOARD", payload: { rankings } },
    });
    await broadcastChannel.unsubscribe();
  },

  startGame: async () => {
    const session = get().session;
    if (!session) return;

    const supabase = createClient();
    const { data: latestPlayers, error: playersError } = await supabase
      .from("session_players")
      .select("*")
      .eq("session_id", session.id)
      .is("kicked_at", null)
      .order("score", { ascending: false });

    if (playersError) throw playersError;

    const players = (latestPlayers as SessionPlayer[]) || [];
    set({ players });

    const notReady = players.filter((p) => !p.is_ready);
    if (players.length > 0 && notReady.length > 0) {
      throw new Error("All players must be ready before starting.");
    }

    const startedAt = new Date().toISOString();
    const q = session.questions_snapshot?.[0];
    const initialLimit = q?.time_limit_sec ?? 20;

    const { error } = await supabase
      .from("sessions")
      .update({
        status: "question_active",
        current_q_index: 0,
        started_at: startedAt,
        current_question_started_at: startedAt,
        current_question_time_limit_sec: initialLimit,
        current_question_remaining_sec: initialLimit,
        is_paused: false,
      })
      .eq("id", session.id);

    if (error) throw error;

    await logHostAction(session.id, "start_game", { question_index: 0 });

    set((s) => {
      if (!s.session) return s;
      return {
        ...s,
        session: {
          ...s.session,
          status: "question_active",
          current_q_index: 0,
          started_at: startedAt,
          current_question_started_at: startedAt,
          current_question_time_limit_sec: initialLimit,
          current_question_remaining_sec: initialLimit,
          is_paused: false,
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
      const endedAt = new Date().toISOString();
      const { error } = await supabase
        .from("sessions")
        .update({ status: "finished", ended_at: endedAt, is_paused: false })
        .eq("id", session.id);

      if (error) throw error;
      await logHostAction(session.id, "finish_game", {});

      set((s) => {
        if (!s.session) return s;
        return {
          ...s,
          session: {
            ...s.session,
            status: "finished",
            ended_at: endedAt,
            is_paused: false,
          },
        };
      });
    } else {
      const nextQuestion = session.questions_snapshot?.[next];
      const now = new Date().toISOString();
      const nextLimit = nextQuestion?.time_limit_sec ?? 20;

      const { error } = await supabase
        .from("sessions")
        .update({
          status: "question_active",
          current_q_index: next,
          current_question_started_at: now,
          current_question_time_limit_sec: nextLimit,
          current_question_remaining_sec: nextLimit,
          is_paused: false,
        })
        .eq("id", session.id);

      if (error) throw error;
      await logHostAction(session.id, "next_question", { question_index: next });

      set((s) => {
        if (!s.session) return s;
        return {
          ...s,
          session: {
            ...s.session,
            status: "question_active",
            current_q_index: next,
            current_question_started_at: now,
            current_question_time_limit_sec: nextLimit,
            current_question_remaining_sec: nextLimit,
            is_paused: false,
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
      .update({ status: "leaderboard", is_paused: false })
      .eq("id", session.id);

    if (error) throw error;

    await logHostAction(session.id, "show_leaderboard", {
      question_index: session.current_q_index,
    });

    set((s) => {
      if (!s.session) return s;
      return {
        ...s,
        session: {
          ...s.session,
          status: "leaderboard",
          is_paused: false,
        },
      };
    });

    await get().fetchAndBroadcastLeaderboard("LEADERBOARD");
  },

  endGame: async () => {
    const session = get().session;
    if (!session) return;

    const supabase = createClient();
    const endedAt = new Date().toISOString();
    const { error } = await supabase
      .from("sessions")
      .update({ status: "finished", ended_at: endedAt, is_paused: false })
      .eq("id", session.id);

    if (error) throw error;
    await logHostAction(session.id, "end_game_early", {});

    set((s) => {
      if (!s.session) return s;
      return {
        ...s,
        session: {
          ...s.session,
          status: "finished",
          ended_at: endedAt,
          is_paused: false,
        },
      };
    });

    await get().fetchAndBroadcastLeaderboard("GAME_OVER");
  },

  pauseGame: async () => {
    const session = get().session;
    if (!session || session.status !== "question_active") return;

    const supabase = createClient();
    const remaining = Math.max(0, get().timeLeft);
    const { error } = await supabase
      .from("sessions")
      .update({ is_paused: true, status: "evaluating", current_question_remaining_sec: remaining })
      .eq("id", session.id);

    if (error) throw error;
    await logHostAction(session.id, "pause_game", { remaining_seconds: remaining });
    get().stopTimer();
  },

  resumeGame: async () => {
    const session = get().session;
    if (!session) return;

    const supabase = createClient();
    const now = new Date().toISOString();
    const remaining = session.current_question_remaining_sec || session.current_question_time_limit_sec || 20;

    const { error } = await supabase
      .from("sessions")
      .update({
        status: "question_active",
        is_paused: false,
        current_question_started_at: now,
        current_question_time_limit_sec: remaining,
        current_question_remaining_sec: remaining,
      })
      .eq("id", session.id);

    if (error) throw error;
    await logHostAction(session.id, "resume_game", { remaining_seconds: remaining });
  },

  setLobbyLocked: async (locked) => {
    const session = get().session;
    if (!session) return;
    const supabase = createClient();
    const { error } = await supabase.from("sessions").update({ lobby_locked: locked }).eq("id", session.id);
    if (error) throw error;
    await logHostAction(session.id, locked ? "lock_lobby" : "unlock_lobby", {});
    set((s) => (s.session ? { session: { ...s.session, lobby_locked: locked } } : s));
  },

  setLateJoin: async (enabled) => {
    const session = get().session;
    if (!session) return;
    const supabase = createClient();
    const { error } = await supabase.from("sessions").update({ allow_late_join: enabled }).eq("id", session.id);
    if (error) throw error;
    await logHostAction(session.id, enabled ? "late_join_enabled" : "late_join_disabled", {});
    set((s) => (s.session ? { session: { ...s.session, allow_late_join: enabled } } : s));
  },

  kickPlayer: async (playerId) => {
    const session = get().session;
    if (!session) return;
    const supabase = createClient();
    const kickedAt = new Date().toISOString();
    const { error } = await supabase
      .from("session_players")
      .update({ kicked_at: kickedAt })
      .eq("id", playerId)
      .eq("session_id", session.id);

    if (error) throw error;
    await logHostAction(session.id, "kick_player", { player_id: playerId });

    set((s) => ({
      players: s.players.filter((p) => p.id !== playerId),
    }));
  },

  mutePlayer: async (playerId, muted) => {
    const session = get().session;
    if (!session) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("session_players")
      .update({ is_muted: muted })
      .eq("id", playerId)
      .eq("session_id", session.id);

    if (error) throw error;
    await logHostAction(session.id, muted ? "mute_player" : "unmute_player", { player_id: playerId });

    set((s) => ({
      players: s.players.map((p) => (p.id === playerId ? { ...p, is_muted: muted } : p)),
    }));
  },

  reset: () => {
    get().stopTimer();
    set({
      session: null,
      players: [],
      currentQuestion: null,
      leaderboard: [],
      answeredCount: 0,
      answerDistribution: [],
      timeLeft: 0,
      realtimeStatus: "disconnected",
      _timerInterval: null,
    });
  },
}));
