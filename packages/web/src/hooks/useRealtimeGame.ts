// ─────────────────────────────────────────────────────────────
// QuizArena — Realtime Game Hook
// Subscribes to Supabase Realtime for live game state changes.
// ─────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/stores/useGameStore";
import type {
  Session,
  SessionPlayer,
  BroadcastEvent,
} from "@quizarena/shared";

type Role = "host" | "player";

export function useRealtimeGame(
  sessionId: string | undefined,
  role: Role
) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const {
    setSession,
    addPlayer,
    removePlayer,
    incrementAnswered,
    setLeaderboard,
    startTimer,
    stopTimer,
    loadSession,
  } = useGameStore();

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`session:${sessionId}`);

    // 1. Listen for session row changes (status, current_q_index)
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

        // Start timer on question_active
        if (updated.status === "question_active" && updated.questions_snapshot) {
          const q = updated.questions_snapshot[updated.current_q_index];
          if (q) startTimer(q.time_limit_sec);
        }

        // Stop timer on evaluating/leaderboard
        if (
          updated.status === "evaluating" ||
          updated.status === "leaderboard" ||
          updated.status === "finished"
        ) {
          stopTimer();
        }
      }
    );

    // 2. Listen for new players joining
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

    // 3. Listen for player answers (host tracks count)
    if (role === "host") {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_answers",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          incrementAnswered();
        }
      );
    }

    // 4. Broadcast channel for custom events (leaderboard, results)
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
