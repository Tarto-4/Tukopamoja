// ─────────────────────────────────────────────────────────────
// QuizArena — Player Leaderboard (between rounds)
// ─────────────────────────────────────────────────────────────

"use client";

import { motion } from "framer-motion";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { MEDALS } from "@quizarena/shared";

export default function PlayerLeaderboard() {
  const { leaderboard, playerId, totalScore, rank } = usePlayerStore();

  return (
    <div className="game-screen items-center gradient-dark px-4 py-6">
      <div className="w-full max-w-md space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-black">🏆 Leaderboard</h2>
          {rank && (
            <p className="text-muted-foreground">
              You&apos;re in <span className="font-bold text-primary">#{rank}</span> place
            </p>
          )}
        </div>

        {/* My score card */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Your Score</p>
          <p className="text-3xl font-display font-black text-primary">
            {totalScore.toLocaleString()}
          </p>
        </div>

        {/* Rankings */}
        <div className="space-y-2">
          {leaderboard.map((entry, i) => {
            const isMe = entry.player_id === playerId;
            return (
              <motion.div
                key={entry.player_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  isMe ? "bg-primary/10 border border-primary/30" : "bg-card"
                }`}
              >
                <span className="text-lg w-8 text-center font-display font-black">
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </span>
                <span className="text-xl">{entry.avatar}</span>
                <span className={`flex-1 font-medium truncate ${isMe ? "text-primary" : ""}`}>
                  {entry.nickname}
                  {isMe && " (you)"}
                </span>
                <span className="font-display font-bold tabular-nums">
                  {entry.score.toLocaleString()}
                </span>
                {entry.streak > 1 && (
                  <span className="text-xs text-quiz-yellow">🔥{entry.streak}</span>
                )}
              </motion.div>
            );
          })}

          {leaderboard.length === 0 && (
            <p className="text-center text-muted-foreground text-sm animate-pulse">
              Waiting for scores...
            </p>
          )}
        </div>

        <p className="text-center text-muted-foreground text-sm animate-pulse">
          Next question coming up...
        </p>
      </div>
    </div>
  );
}
