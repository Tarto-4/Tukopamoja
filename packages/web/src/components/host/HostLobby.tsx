// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Host Lobby (waiting room with QR + player list)
// ─────────────────────────────────────────────────────────────

"use client";

import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { useBrandingStore } from "@/stores/useBrandingStore";
import { Button } from "@/components/ui/button";
import QRCodeDisplay from "./QRCodeDisplay";
import { Lock, LockOpen, Play, Users, UserX, VolumeX, Volume2, ChevronLeft, ChevronRight, Star, MessageSquare } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

const PAGE_SIZE = 12;

export default function HostLobby() {
  const {
    session,
    players,
    startGame,
    setLobbyLocked,
    setLateJoin,
    setFeedbackSettings,
    kickPlayer,
    mutePlayer,
  } = useGameStore();
  const { branding } = useBrandingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(players.length / PAGE_SIZE)), [players.length]);
  const currentPage = Math.min(page, totalPages);
  const currentPlayers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return players.slice(start, start + PAGE_SIZE);
  }, [players, currentPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function handleStart() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await startGame();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    } finally {
      setLoading(false);
    }
  }

  if (!session) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const joinUrl =
    typeof window !== "undefined"
      ? (() => {
          const normalize = (value: string) => value.replace(/\/$/, "");
          const isLocalhost = (value: string) => {
            try {
              const hostname = new URL(value).hostname;
              return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);
            } catch {
              return false;
            }
          };

          const origin = normalize(window.location.origin);
          const envUrl = normalize(appUrl);
          const hasConfiguredPublicUrl = !!envUrl && !isLocalhost(envUrl);

          const baseUrl = hasConfiguredPublicUrl ? envUrl : origin;

          return `${baseUrl}/join/?pin=${session.pin}`;
        })()
      : "";

  return (
    <div className="game-screen gradient-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <img
        src={withBasePath("/designs/tuko-pamoja.png")}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 m-auto w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] md:w-[560px] md:h-[560px] object-contain opacity-[0.16] pointer-events-none"
      />
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 relative z-10">
        <div className="flex items-center gap-3">
          {branding?.logo_url && (
            <img
              src={branding.logo_url}
              alt={branding.name}
              loading="lazy"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-contain"
            />
          )}
          <span className="font-serif font-bold text-lg text-white">
            {branding?.name || (<><span className="text-[#eecd00]">TUKO</span><span className="text-white/90">PAMOJA</span></>)}
          </span>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8 relative z-10">
        {/* Join methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl w-full">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-4 rounded-2xl glass p-6 border border-white/15">
            <h2 className="text-lg font-serif text-white/70">
              Scan to Join
            </h2>
            <QRCodeDisplay value={joinUrl} />
          </div>

          {/* PIN display */}
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl glass p-6 border border-white/15">
            <h2 className="text-lg font-serif text-white/70">
              Game PIN
            </h2>
            <div
              role="status"
              aria-label={`Game PIN: ${session.pin}`}
              className="text-5xl sm:text-6xl md:text-7xl font-serif font-black tracking-[0.15em] sm:tracking-[0.2em] py-3 px-5 sm:py-4 sm:px-8 rounded-2xl glow-crimson gradient-primary text-black"
            >
              {session.pin}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Open the app and enter this PIN
            </p>
          </div>
        </div>

        {/* Player list */}
        <div className="text-center w-full max-w-3xl rounded-2xl glass p-6 border border-white/15">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {players.length} player{players.length !== 1 ? "s" : ""} joined
            </span>
            <span className="text-xs rounded-full px-2 py-1 bg-primary/15 border border-primary/30 text-primary">
              {players.filter((p) => p.is_ready).length} ready
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <Button
              size="sm"
              variant={session.lobby_locked ? "destructive" : "secondary"}
              onClick={() => setLobbyLocked(!session.lobby_locked)}
            >
              {session.lobby_locked ? <Lock className="w-4 h-4 mr-1" /> : <LockOpen className="w-4 h-4 mr-1" />}
              {session.lobby_locked ? "Lobby Locked" : "Lock Lobby"}
            </Button>
            <Button
              size="sm"
              variant={session.allow_late_join ? "secondary" : "outline"}
              onClick={() => setLateJoin(!session.allow_late_join)}
            >
              {session.allow_late_join ? "Late Join: ON" : "Late Join: OFF"}
            </Button>
          </div>

          {/* Feedback settings */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <Button
              size="sm"
              variant={session.require_feedback ? "default" : "outline"}
              onClick={() => setFeedbackSettings({ require_feedback: !session.require_feedback })}
              title="When enabled, players rate the presentation after the game"
            >
              <Star className="w-4 h-4 mr-1" />
              {session.require_feedback ? "Feedback: ON" : "Feedback: OFF"}
            </Button>
            {session.require_feedback && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFeedbackSettings({
                      feedback_scale: session.feedback_scale === 5 ? 10 : 5,
                    })
                  }
                  title="Toggle between 5-star and 10-star rating scale"
                >
                  {session.feedback_scale}-Star Scale
                </Button>
                <Button
                  size="sm"
                  variant={session.feedback_comment_enabled ? "secondary" : "outline"}
                  onClick={() =>
                    setFeedbackSettings({
                      feedback_comment_enabled: !session.feedback_comment_enabled,
                    })
                  }
                  title="Allow players to leave a written comment"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {session.feedback_comment_enabled ? "Comments: ON" : "Comments: OFF"}
                </Button>
              </>
            )}
          </div>

          {players.length > 0 && (
            <>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {currentPlayers.map((p) => (
                  <div
                    key={p.id}
                      className="rounded-xl px-3 py-2 flex items-center justify-between gap-3 bg-white/5 border border-white/10"
                  >
                    <div className="text-left min-w-0">
                      <p className="font-medium truncate">{p.avatar} {p.first_name} {p.last_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.is_ready ? "Ready" : "Not ready"}
                        {p.is_muted ? " • Muted" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => mutePlayer(p.id, !p.is_muted)} aria-label={p.is_muted ? `Unmute ${p.first_name}` : `Mute ${p.first_name}`}>
                        {p.is_muted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => kickPlayer(p.id)} aria-label={`Kick ${p.first_name}`}>
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Start button */}
        <Button
          size="xl"
          onClick={handleStart}
          disabled={loading}
          variant="game"
          className="text-xl w-full max-w-xs"
        >
          <Play className="w-5 h-5 mr-2" />
          {loading
            ? "Starting..."
            : `Start Game (${players.length} player${players.length !== 1 ? "s" : ""})`}
        </Button>

        {error && (
          <p className="text-sm text-destructive text-center font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
