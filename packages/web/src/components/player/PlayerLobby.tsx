// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Player Lobby (waiting for host to start)
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
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <img
        src={withBasePath("/designs/tuko-pamoja.png")}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 m-auto w-[420px] h-[420px] object-contain opacity-[0.18] pointer-events-none"
      />
      <div className="text-center space-y-8 max-w-md w-full relative z-10">
        {/* Player identity */}
        <div className="space-y-2 rounded-2xl glass p-6 border border-white/15">
          <div className="text-6xl">{avatar}</div>
          <h2 className="text-2xl font-serif font-bold">{nickname}</h2>
          <p className="text-muted-foreground text-sm">You&apos;re in!</p>
        </div>

        {/* Waiting indicator */}
        <div className="glass rounded-2xl p-6 space-y-4 border border-white/15">
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
              variant={isReady ? "game" : "game-outline"}
              onClick={() => toggleReady(!isReady)}
              className="w-full sm:w-auto"
            >
              {isReady ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Circle className="w-4 h-4 mr-2" />
              )}
              {isReady ? "Ready ✓" : "Mark me ready"}
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
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    p.id === playerId
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-secondary-foreground border border-border"
                  }`}
                >
                  {p.avatar} {p.first_name} {p.last_name}{p.is_ready ? " ✓" : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
