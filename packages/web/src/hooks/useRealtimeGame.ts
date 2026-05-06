// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Realtime Game Hook
// Subscribes to Supabase Realtime for live game state changes.
// ─────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/stores/useGameStore";
import type { Session, SessionPlayer, BroadcastEvent } from "@tukopamoja/shared";

type Role = "host" | "player";

export function useRealtimeGame(sessionId: string | undefined, role: Role) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const {
    setSession,
    addPlayer,
    removePlayer,
    setPlayers,
    incrementAnswered,
    setLeaderboard,
    setRealtimeStatus,
    startTimer,
    stopTimer,
  } = useGameStore();

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let activeChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    const subscribe = (attempt: number) => {
      if (cancelled) return;

      // Clean up any previous failed channel before creating a new one
      if (activeChannel) {
        activeChannel.unsubscribe();
        activeChannel = null;
      }

      setRealtimeStatus(attempt > 0 ? "reconnecting" : "connecting");

      let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
      try {
        channel = createClient().channel(`session:${sessionId}`);
        activeChannel = channel;
      } catch (error) {
        console.error("[Realtime] Failed to initialize Supabase client:", error);
        return;
      }

      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as Session;
          setSession(updated);

          if (updated.status === "question_active" && updated.questions_snapshot) {
            const q = updated.questions_snapshot[updated.current_q_index];
            if (q) {
              const duration = updated.current_question_remaining_sec || updated.current_question_time_limit_sec || q.time_limit_sec;
              startTimer(duration);
            }
          }

          if (updated.status === "evaluating" || updated.status === "leaderboard" || updated.status === "finished") {
            stopTimer();
          }
        }
      );

      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_players",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const player = payload.new as SessionPlayer;
          if (!player.kicked_at) addPlayer(player);
        }
      );

      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "session_players",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updatedPlayer = payload.new as SessionPlayer;
          if (updatedPlayer.kicked_at) {
            removePlayer(updatedPlayer.id);
            return;
          }

          const currentPlayers = useGameStore.getState().players;
          const exists = currentPlayers.some((player) => player.id === updatedPlayer.id);
          if (!exists) {
            addPlayer(updatedPlayer);
            return;
          }

          setPlayers(
            currentPlayers.map((player) =>
              player.id === updatedPlayer.id ? updatedPlayer : player
            )
          );
        }
      );

      if (role === "host") {
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "player_answers",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const answer = payload.new as { selected_option?: number };
            incrementAnswered(answer.selected_option);
          }
        );
      }

      channel.on("broadcast", { event: "game_event" }, (payload) => {
        const event = payload.payload as BroadcastEvent;
        if (event.type === "LEADERBOARD") setLeaderboard(event.payload.rankings);
        if (event.type === "GAME_OVER") setLeaderboard(event.payload.final_rankings);
      });

      channel.subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
          channelRef.current = channel;
          return;
        }

        if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("reconnecting");
          const delay = Math.min(15000, 1000 * 2 ** Math.min(attempt, 4));
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = setTimeout(() => subscribe(attempt + 1), delay);
        }
      });
    };

    subscribe(0);

    return () => {
      cancelled = true;
      stopTimer();
      setRealtimeStatus("disconnected");
      if (retryTimer) clearTimeout(retryTimer);
      if (activeChannel) {
        activeChannel.unsubscribe();
        activeChannel = null;
      }
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionId, role, setSession, addPlayer, removePlayer, setPlayers, incrementAnswered, setLeaderboard, setRealtimeStatus, startTimer, stopTimer]);
}
