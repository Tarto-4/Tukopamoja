// ─────────────────────────────────────────────────────────────
// QuizArena — Host Lobby (waiting room with QR + player list)
// ─────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { useBrandingStore } from "@/stores/useBrandingStore";
import { Button } from "@/components/ui/button";
import QRCodeDisplay from "./QRCodeDisplay";
import { Play, Users } from "lucide-react";

export default function HostLobby() {
  const { session, players, startGame } = useGameStore();
  const { branding } = useBrandingStore();

  if (!session) return null;

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?pin=${session.pin}`
      : "";

  return (
    <div className="game-screen gradient-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3">
          {branding?.logo_url && (
            <img
              src={branding.logo_url}
              alt={branding.name}
              className="w-10 h-10 rounded object-contain"
            />
          )}
          <span className="font-display font-bold text-lg">
            {branding?.name || "QuizArena"}
          </span>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
        {/* Join methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl w-full">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-lg font-display text-muted-foreground">
              Scan to Join
            </h2>
            <QRCodeDisplay value={joinUrl} />
          </div>

          {/* PIN display */}
          <div className="flex flex-col items-center justify-center gap-4">
            <h2 className="text-lg font-display text-muted-foreground">
              Game PIN
            </h2>
            <div
              className="text-6xl sm:text-7xl font-display font-black tracking-[0.2em] py-4 px-8 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${branding?.primary_color || "#6C5CE7"}, ${branding?.secondary_color || "#00CEC9"})`,
              }}
            >
              {session.pin}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Open the app and enter this PIN
            </p>
          </div>
        </div>

        {/* Player list */}
        <div className="text-center w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {players.length} player{players.length !== 1 ? "s" : ""} joined
            </span>
          </div>

          {players.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto">
              {players.map((p) => (
                <span
                  key={p.id}
                  className="px-3 py-1.5 rounded-full bg-card border text-sm font-medium"
                >
                  {p.avatar} {p.nickname}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Start button */}
        <Button
          size="xl"
          onClick={startGame}
          disabled={players.length < 1}
          className="gradient-primary border-0 text-xl"
        >
          <Play className="w-5 h-5 mr-2" />
          Start Game ({players.length} player{players.length !== 1 ? "s" : ""})
        </Button>
      </div>
    </div>
  );
}
