"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/stores/useGameStore";
import { useBrandingStore } from "@/stores/useBrandingStore";
import { useRealtimeGame } from "@/hooks/useRealtimeGame";
import HostLobby from "@/components/host/HostLobby";
import HostQuestion from "@/components/host/HostQuestion";
import HostLeaderboard from "@/components/host/HostLeaderboard";
import HostGameOver from "@/components/host/HostGameOver";

function HostSessionContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const { session, loadSession } = useGameStore();
  const { fetchBranding } = useBrandingStore();

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  useEffect(() => {
    if (sessionId) loadSession(sessionId);
  }, [sessionId, loadSession]);

  useRealtimeGame(sessionId, "host");

  if (!sessionId) {
    return (
      <div className="game-screen items-center justify-center gradient-dark relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
        <p className="text-muted-foreground">Missing session id.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="game-screen items-center justify-center gradient-dark relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
        <p className="text-muted-foreground animate-pulse">Loading session...</p>
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

export default function HostSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="game-screen items-center justify-center gradient-dark relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      }
    >
      <HostSessionContent />
    </Suspense>
  );
}
