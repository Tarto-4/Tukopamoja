// ─────────────────────────────────────────────────────────────
// QuizArena — Player Game Over
// ─────────────────────────────────────────────────────────────

"use client";

import { motion } from "framer-motion";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import WinnerCelebration from "@/components/ui/WinnerCelebration";
import { MEDALS } from "@quizarena/shared";
import { Trophy, RotateCcw } from "lucide-react";

export default function PlayerGameOver() {
  const { leaderboard, playerId, totalScore, rank, nickname, avatar, reset } =
    usePlayerStore();

  const top5 = leaderboard.slice(0, 5);
  const isTop3 = rank !== null && rank <= 3;
  const isWinner = rank === 1;

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4 py-6 relative overflow-hidden">
      <WinnerCelebration active={isWinner} winnerLabel="Champion" />
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Celebration header */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="space-y-2"
        >
          {isTop3 ? (
            <span className="text-7xl block">{MEDALS[(rank ?? 1) - 1]}</span>
          ) : (
            <Trophy className="w-16 h-16 mx-auto text-quiz-yellow" />
          )}
          <h1 className="text-3xl font-serif font-black">Game Over!</h1>
        </motion.div>

        {/* Player result card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-elevated rounded-2xl p-6 space-y-3"
        >
          <div className="text-4xl">{avatar}</div>
          <p className="font-serif font-bold text-lg">{nickname}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Final Score</p>
              <p className="text-2xl font-serif font-black text-primary">
                {totalScore.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rank</p>
              <p className="text-2xl font-serif font-black">
                {rank ? `#${rank}` : "—"}
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
            className="space-y-2"
          >
            <h3 className="text-sm font-serif text-ens-slate-light">
              Final Standings
            </h3>
            {top5.map((entry, i) => {
              const isMe = entry.player_id === playerId;
              return (
                <div
                  key={entry.player_id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    isMe
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-card/50"
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

        {/* Play again */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            reset();
            window.location.href = "/join/";
          }}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Play Again
        </Button>
      </div>
    </div>
  );
}
