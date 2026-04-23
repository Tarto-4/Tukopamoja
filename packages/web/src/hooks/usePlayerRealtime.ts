// ─────────────────────────────────────────────────────────────
// QuizArena — Player Realtime Hook
// Subscribes to session changes for the player side.
// ─────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePlayerStore } from "@/stores/usePlayerStore";
import type { Session, SessionPlayer, BroadcastEvent } from "@quizarena/shared";

export function usePlayerRealtime(sessionId: string | undefined) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const {
    setSession,
    addPlayer,
    setLeaderboard,
    startTimer,
    stopTimer,
  } = usePlayerStore();

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`session:${sessionId}`);

    // 1. Session row updates (status, current_q_index)
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
          if (q) startTimer(q.time_limit_sec);
        }

        if (
          updated.status === "evaluating" ||
          updated.status === "leaderboard" ||
          updated.status === "finished"
        ) {
          stopTimer();
        }
      }
    );

    // 2. New players joining
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "session_players",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        addPlayer(payload.new as SessionPlayer);
      }
    );

    // 3. Broadcast events (leaderboard, game over)
    channel.on("broadcast", { event: "game_event" }, (payload) => {
      const event = payload.payload as BroadcastEvent;

      switch (event.type) {
        case "LEADERBOARD":
          setLeaderboard(event.payload.rankings);
          break;
        case "GAME_OVER":
          setLeaderboard(event.payload.final_rankings);
          break;
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      stopTimer();
      channel.unsubscribe();
    };
  }, [sessionId]);
}
