// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Player Leaderboard (between rounds)
// ─────────────────────────────────────────────────────────────

"use client";

import { motion } from "framer-motion";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { MEDALS } from "@tukopamoja/shared";

export default function PlayerLeaderboard() {
  const { leaderboard, playerId, totalScore, rank } = usePlayerStore();

  return (
    <div className="game-screen items-center gradient-dark px-4 py-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <div className="w-full max-w-md space-y-6">
        {/* Title */}
        <div className="text-center space-y-2 relative z-10">
          <h2 className="text-2xl font-serif font-black">🏆 Leaderboard</h2>
          {rank && (
            <p className="text-muted-foreground">
              You&apos;re in <span className="font-bold text-primary">#{rank}</span> place
            </p>
          )}
        </div>

        {/* My score card */}
        <div className="glass border border-primary/30 rounded-xl p-4 text-center relative z-10">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Your Score</p>
          <p className="text-4xl font-serif font-black text-primary text-glow-gold mt-1">
            {totalScore.toLocaleString()}
          </p>
        </div>

        {/* Rankings */}
        <div className="space-y-2 relative z-10 rounded-2xl glass p-4 border border-white/12">
          {leaderboard.map((entry, i) => {
            const isMe = entry.player_id === playerId;
            return (
              <motion.div
                key={entry.player_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`lb-row ${isMe ? "lb-row--me" : ""}`}
              >
                <span className="text-lg w-8 text-center font-serif font-black shrink-0">
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </span>
                <span className="text-xl shrink-0">{entry.avatar}</span>
                <span className={`flex-1 font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                  {entry.nickname}
                  {isMe && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                </span>
                <span className="font-serif font-bold tabular-nums text-sm">{entry.score.toLocaleString()}</span>
                {entry.streak > 1 && (
                  <span className="text-xs font-bold shrink-0 text-game-streak drop-shadow-[0_0_8px_rgba(255,159,0,0.5)]">
                    🔥{entry.streak}
                  </span>
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
