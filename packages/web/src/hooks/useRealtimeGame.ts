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
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

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
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    try {
      const supabase = createClient();
      channel = supabase.channel(`session:${sessionId}`);
    } catch (error) {
      console.error("[Realtime] Failed to initialize Supabase client:", error);
      return;
    }

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

        // Start timer on question_active (with auto-advance for host)
        if (updated.status === "question_active" && updated.questions_snapshot) {
          const q = updated.questions_snapshot[updated.current_q_index];
          if (q) {
            if (role === "host") {
              startTimer(q.time_limit_sec, () => {
                // Auto-show leaderboard when timer expires
                const store = useGameStore.getState();
                if (store.session?.status === "question_active") {
                  store.showLeaderboard().catch(() => {});
                }
              });
            } else {
              startTimer(q.time_limit_sec);
            }
          }
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
        const player = payload.new as SessionPlayer;
        addPlayer(player);

        // Keep local player_count in sync for host answer counter
        if (role === "host") {
          const store = useGameStore.getState();
          if (store.session) {
            store.setSession({
              ...store.session,
              player_count: store.players.length + 1,
            });
          }
        }
      }
    );

    // 3. Listen for player answers (host tracks count + distribution)
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
      channel?.unsubscribe();
    };
  }, [sessionId, role, setSession, addPlayer, removePlayer, incrementAnswered, setLeaderboard, startTimer, stopTimer, loadSession]);
}
