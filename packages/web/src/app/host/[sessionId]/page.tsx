// ─────────────────────────────────────────────────────────────
// QuizArena — Live Host Screen
// Drives the game from the host's perspective:
//   Lobby (QR + PIN) → Question → Evaluating → Leaderboard → Game Over
// ─────────────────────────────────────────────────────────────

"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGameStore } from "@/stores/useGameStore";
import { useRealtimeGame } from "@/hooks/useRealtimeGame";
import HostLobby from "@/components/host/HostLobby";
import HostQuestion from "@/components/host/HostQuestion";
import HostLeaderboard from "@/components/host/HostLeaderboard";
import HostGameOver from "@/components/host/HostGameOver";

export default function HostSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { session, loadSession } = useGameStore();

  // Load session data on mount
  useEffect(() => {
    if (sessionId) loadSession(sessionId);
  }, [sessionId, loadSession]);

  // Connect to realtime channel
  useRealtimeGame(sessionId, "host");

  if (!session) {
    return (
      <div className="game-screen items-center justify-center gradient-dark">
        <p className="text-muted-foreground animate-pulse">
          Loading session...
        </p>
      </div>
    );
  }

  switch (session.status) {
    case "lobby":
      return <HostLobby />;
    case "question_active":
    case "evaluating":
      return <HostQuestion />;
    case "leaderboard":
      return <HostLeaderboard />;
    case "finished":
      return <HostGameOver />;
    default:
      return null;
  }
}
