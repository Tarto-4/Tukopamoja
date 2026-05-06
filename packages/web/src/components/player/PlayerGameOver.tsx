// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Player Game Over
// ─────────────────────────────────────────────────────────────

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import WinnerCelebration from "@/components/ui/WinnerCelebration";
import { MEDALS } from "@tukopamoja/shared";
import { Trophy, RotateCcw, House, Sparkles, Users, TimerReset } from "lucide-react";
import BrandedBackground from "@/components/ui/BrandedBackground";

export default function PlayerGameOver() {
  const router = useRouter();
  const { session, leaderboard, playerId, totalScore, rank, nickname, avatar, reset } =
    usePlayerStore();
  const [countdown, setCountdown] = useState(10);
  const hasRedirected = useRef(false);

  const top5 = leaderboard.slice(0, 5);
  const isTop3 = rank !== null && rank <= 3;
  const isWinner = rank === 1;
  const playerCount = session?.player_count ?? leaderboard.length;
  const sessionPin = session?.pin;

  const handleReturnHome = useCallback(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    reset();
    router.push("/join");
  }, [reset, router]);

  const handlePlayAgain = useCallback(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    reset();
    router.push(sessionPin ? `/join/?pin=${sessionPin}` : "/join");
  }, [reset, router, sessionPin]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          handleReturnHome();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [handleReturnHome]);

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4 py-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <BrandedBackground className="z-0" />
      <WinnerCelebration active={isWinner} winnerLabel="Champion" />
      <div className="w-full max-w-2xl space-y-6 text-center relative z-10">
        {/* Celebration header */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="space-y-3"
        >
          {isTop3 ? (
            <span className="text-7xl block">{MEDALS[(rank ?? 1) - 1]}</span>
          ) : (
            <Trophy className="w-16 h-16 mx-auto text-quiz-yellow" />
          )}
          <h1 className="text-3xl sm:text-4xl font-serif font-black">Game Complete</h1>
          <p className="text-foreground/75 dark:text-white/70 max-w-xl mx-auto">
            Great run, {nickname}. Your results are locked in and you will return to the player home screen automatically.
          </p>
        </motion.div>

        {/* Player result card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-3xl p-6 sm:p-8 space-y-5 border border-white/15"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl">{avatar}</span>
            <div className="text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 dark:text-white/55">Player Summary</p>
              <p className="font-serif font-bold text-xl">{nickname}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs text-muted-foreground">Final Score</p>
                <p className="text-2xl font-serif font-black text-primary mt-1">
                  {totalScore.toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs text-muted-foreground">Rank</p>
                <p className="text-2xl font-serif font-black mt-1">
                  {rank ? `#${rank}` : "—"}
                </p>
              </div>
            </div>
            <div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs text-muted-foreground">Players</p>
                <p className="text-2xl font-serif font-black mt-1">
                  {playerCount}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl border border-[#EEDC00]/20 bg-[#EEDC00]/10 px-4 py-4">
              <div className="flex items-center gap-2 text-[#B18A00] dark:text-[#EEDC00] mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Finish highlight</span>
              </div>
              <p className="text-sm text-foreground/80 dark:text-white/75">
                {isWinner
                  ? "You finished at the top of the leaderboard. Outstanding performance."
                  : isTop3
                  ? "You landed on the podium. Strong finish."
                  : "Your results are saved. Jump back in for another round."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-center gap-2 text-foreground/75 dark:text-white/75 mb-2">
                <TimerReset className="w-4 h-4" />
                <span className="text-sm font-semibold">Auto return</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Returning to the player home screen in <span className="font-semibold text-foreground dark:text-white">{countdown}s</span>.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Final standings */}
        {top5.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 rounded-3xl glass p-5 border border-white/15"
          >
            <div className="flex items-center justify-center gap-2 text-foreground/70 dark:text-white/70">
              <Users className="w-4 h-4" />
              <h3 className="text-sm font-serif uppercase tracking-[0.2em]">
                Final Standings
              </h3>
            </div>
            {top5.map((entry, i) => {
              const isMe = entry.player_id === playerId;
              return (
                <div
                  key={entry.player_id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    isMe
                      ? "bg-[#EEDC00]/10 border border-[#EEDC00]/30"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <span className="text-lg w-8 text-center">
                    {i < 3 ? MEDALS[i] : `#${i + 1}`}
                  </span>
                  <span>{entry.avatar}</span>
                  <span
                    className={`flex-1 text-sm truncate ${isMe ? "font-bold text-primary" : ""}`}
                  >
                    {entry.nickname}
                    {isMe && " (you)"}
                  </span>
                  <span className="text-sm font-serif font-bold tabular-nums">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            size="lg"
            onClick={handleReturnHome}
            className="w-full gradient-primary border-0 btn-3d text-black font-semibold"
          >
            <House className="w-4 h-4 mr-2" />
            Return to Player Home
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handlePlayAgain}
            className="w-full border-[#EEDC00]/30 bg-[#EEDC00]/10 text-[#B18A00] dark:text-[#EEDC00] hover:bg-[#EEDC00]/20"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
}
