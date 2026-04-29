// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — /play page
// Player game loop: lobby → question → leaderboard → game over
// ─────────────────────────────────────────────────────────────

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePlayerRealtime } from "@/hooks/usePlayerRealtime";
import PlayerLobby from "@/components/player/PlayerLobby";
import PlayerQuestion from "@/components/player/PlayerQuestion";
import PlayerLeaderboard from "@/components/player/PlayerLeaderboard";
import PlayerGameOver from "@/components/player/PlayerGameOver";
import HamsterLoader from "@/components/ui/HamsterLoader";

function PlayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const { session, rejoinSession } = usePlayerStore();
  const [loading, setLoading] = useState(true);

  // Try to rejoin or redirect to /join if no session
  useEffect(() => {
    async function init() {
      if (sessionId && !session) {
        // Already have sessionId in URL — try rejoin from localStorage
        const ok = await rejoinSession();
        if (!ok) {
          router.replace(`/join/?pin=`);
          return;
        }
      } else if (!sessionId && !session) {
        router.replace("/join/");
        return;
      }
      setLoading(false);
    }
    init();
  }, [sessionId]);

  // Subscribe to realtime
  const activeSessionId = session?.id || sessionId;
  usePlayerRealtime(activeSessionId || undefined);

  if (loading || !session) {
    return (
      <div className="game-screen items-center justify-center gradient-dark gap-4">
        <HamsterLoader label="Joining game" />
        <p className="text-muted-foreground animate-pulse">Joining game...</p>
      </div>
    );
  }

  switch (session.status) {
    case "lobby":
      return <PlayerLobby />;
    case "question_active":
    case "evaluating":
      return <PlayerQuestion />;
    case "leaderboard":
      return <PlayerLeaderboard />;
    case "finished":
      return <PlayerGameOver />;
    default:
      return null;
  }
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="game-screen items-center justify-center gradient-dark gap-4">
          <HamsterLoader label="Loading game" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      }
    >
      <PlayPageContent />
    </Suspense>
  );
}
