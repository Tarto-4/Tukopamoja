// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Player Lobby (waiting for host to start)
// ─────────────────────────────────────────────────────────────

"use client";

import { usePlayerStore } from "@/stores/usePlayerStore";
import { useBrandingStore } from "@/stores/useBrandingStore";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Users } from "lucide-react";
import HamsterLoader from "@/components/ui/HamsterLoader";
import BrandedBackground from "@/components/ui/BrandedBackground";

export default function PlayerLobby() {
  const { session, players, nickname, avatar, playerId, toggleReady } = usePlayerStore();
  const { branding } = useBrandingStore();

  if (!session) return null;

  const me = players.find((p) => p.id === playerId);
  const isReady = !!me?.is_ready;

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4 relative overflow-hidden">
      <BrandedBackground className="z-0" />
      {/* Brand identity */}
      {branding?.logo_url && (
        <div className="absolute top-4 left-4 flex items-center gap-2 z-30">
          <img src={branding.logo_url} alt={branding.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded object-contain" />
          <span className="text-xs font-semibold text-white/60 hidden sm:inline">
            {branding.name}
          </span>
        </div>
      )}
      <div className="text-center space-y-6 max-w-md w-full relative z-10">
        {/* Player identity */}
        <div className="space-y-3 rounded-2xl bg-card p-6 border border-border shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
          <div className="text-5xl sm:text-6xl">{avatar}</div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">{nickname}</h2>
          <p className="text-muted-foreground text-sm">You&apos;re in!</p>
        </div>

        {/* Waiting indicator */}
        <div className="rounded-2xl bg-card p-6 space-y-4 border border-border shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
          <HamsterLoader label="Waiting for host to start" className="scale-75" />
          <p className="text-base sm:text-lg font-medium text-foreground">
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
              aria-pressed={isReady}
              className="w-full sm:w-auto min-h-[48px]"
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
              {players.slice(0, 30).map((p) => (
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
              {players.length > 30 && (
                <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-secondary text-muted-foreground border border-border">
                  +{players.length - 30} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
