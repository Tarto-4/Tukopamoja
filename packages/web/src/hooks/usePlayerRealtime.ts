// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Player Realtime Hook
// Subscribes to session changes for the player side.
// ─────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePlayerStore } from "@/stores/usePlayerStore";
import type { Session, SessionPlayer, BroadcastEvent } from "@quizarena/shared";

export function usePlayerRealtime(sessionId: string | undefined) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const {
    playerId,
    setSession,
    addPlayer,
    removePlayer,
    setLeaderboard,
    setRealtimeStatus,
    startTimer,
    stopTimer,
  } = usePlayerStore();

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const subscribe = (attempt: number) => {
      if (cancelled) return;
      setRealtimeStatus(attempt > 0 ? "reconnecting" : "connecting");

      const channel = createClient().channel(`session:${sessionId}`);

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
            if (updatedPlayer.id === playerId) {
              setRealtimeStatus("disconnected");
            }
          }
        }
      );

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
      channelRef.current?.unsubscribe();
    };
  }, [sessionId, playerId, setSession, addPlayer, removePlayer, setLeaderboard, setRealtimeStatus, startTimer, stopTimer]);
}
