// ─────────────────────────────────────────────────────────────
// QuizArena — Player Lobby (waiting for host to start)
// ─────────────────────────────────────────────────────────────

"use client";

import { usePlayerStore } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Users } from "lucide-react";
import HamsterLoader from "@/components/ui/HamsterLoader";
import { withBasePath } from "@/lib/base-path";

export default function PlayerLobby() {
  const { session, players, nickname, avatar, playerId, toggleReady } = usePlayerStore();

  if (!session) return null;

  const me = players.find((p) => p.id === playerId);
  const isReady = !!me?.is_ready;

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4 relative overflow-hidden">
      <img
        src={withBasePath("/designs/backgrounds/brand-mark-overlay.svg")}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 m-auto w-[420px] h-[420px] object-contain opacity-[0.18] pointer-events-none"
      />
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Player identity */}
        <div className="space-y-2">
          <div className="text-6xl">{avatar}</div>
          <h2 className="text-2xl font-serif font-bold">{nickname}</h2>
          <p className="text-muted-foreground text-sm">You&apos;re in!</p>
        </div>

        {/* Waiting indicator */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <HamsterLoader label="Waiting for host to start" className="scale-75" />
          <p className="text-lg font-serif">
            {isReady ? "Waiting for host to start..." : "Tap ready so the host can start"}
          </p>
          <p className="text-muted-foreground text-sm">
            Game PIN: <span className="font-mono font-bold tracking-wider">{session.pin}</span>
          </p>
          <div className="flex flex-col items-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => toggleReady(!isReady)}
              className={isReady ? "gradient-primary border-0 btn-3d text-white font-semibold" : "w-full sm:w-auto"}
              variant={isReady ? "default" : "outline"}
            >
              {isReady ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Circle className="w-4 h-4 mr-2" />
              )}
              {isReady ? "Ready" : "Mark me ready"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Host start is blocked until all joined players are ready.
            </p>
          </div>
        </div>

        {/* Player list */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {players.length} player{players.length !== 1 ? "s" : ""} joined
            </span>
          </div>
          {players.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto">
              {players.map((p) => (
                <span
                  key={p.id}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    p.id === usePlayerStore.getState().playerId
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border"
                  }`}
                >
                  {p.avatar} {p.nickname}{p.is_ready ? " ✓" : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
