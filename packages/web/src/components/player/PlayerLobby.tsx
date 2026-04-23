// ─────────────────────────────────────────────────────────────
// QuizArena — Player Lobby (waiting for host to start)
// ─────────────────────────────────────────────────────────────

"use client";

import { usePlayerStore } from "@/stores/usePlayerStore";
import { Users, Loader2 } from "lucide-react";

export default function PlayerLobby() {
  const { session, players, nickname, avatar } = usePlayerStore();

  if (!session) return null;

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Player identity */}
        <div className="space-y-2">
          <div className="text-6xl">{avatar}</div>
          <h2 className="text-2xl font-serif font-bold">{nickname}</h2>
          <p className="text-muted-foreground text-sm">You&apos;re in!</p>
        </div>

        {/* Waiting indicator */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
          <p className="text-lg font-serif">Waiting for host to start...</p>
          <p className="text-muted-foreground text-sm">
            Game PIN: <span className="font-mono font-bold tracking-wider">{session.pin}</span>
          </p>
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
                  {p.avatar} {p.nickname}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
