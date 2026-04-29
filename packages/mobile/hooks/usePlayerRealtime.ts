// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA Mobile — Realtime Hook for Player
// Subscribes to session changes via Supabase Realtime.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { usePlayerStore } from "../stores/usePlayerStore";
import type { Session, BroadcastEvent } from "@quizarena/shared";

export function usePlayerRealtime() {
  const {
    session,
    setStatus,
    setQuestion,
    setLeaderboard,
    startTimer,
    stopTimer,
  } = usePlayerStore();

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!session?.id) return;

    const channel = supabase.channel(`session:${session.id}`);

    // Listen for session state changes
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "sessions",
        filter: `id=eq.${session.id}`,
      },
      (payload) => {
        const updated = payload.new as Session;
        setStatus(updated.status);

        if (
          updated.status === "question_active" &&
          updated.questions_snapshot
        ) {
          const q = updated.questions_snapshot[updated.current_q_index];
          if (q) {
            // Strip is_correct from options before setting (server should do this,
            // but as safety measure we also do it client-side)
            const safeQ = {
              ...q,
              options: q.options.map((o) => ({
                text: o.text,
                is_correct: false, // hidden from player
              })),
            };
            setQuestion(q, updated.current_q_index);
            startTimer(q.time_limit_sec);
          }
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

    // Listen for broadcast events (leaderboard updates)
    channel.on("broadcast", { event: "game_event" }, (payload) => {
      const event = payload.payload as BroadcastEvent;

      if (event.type === "LEADERBOARD") {
        setLeaderboard(event.payload.rankings);
      }
      if (event.type === "GAME_OVER") {
        setLeaderboard(event.payload.final_rankings);
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      stopTimer();
      channel.unsubscribe();
    };
  }, [session?.id]);
}
