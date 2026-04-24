// ─────────────────────────────────────────────────────────────
// QuizArena — Host Game Over Screen
// ─────────────────────────────────────────────────────────────

"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/useGameStore";
import { Button } from "@/components/ui/button";
import WinnerCelebration from "@/components/ui/WinnerCelebration";
import { MEDALS } from "@quizarena/shared";

export default function HostGameOver() {
  const router = useRouter();
  const { leaderboard, reset } = useGameStore();

  const top3 = leaderboard.slice(0, 3);
  const winner = top3[0];

  return (
    <div className="game-screen items-center justify-center gradient-dark p-4 sm:p-8 relative overflow-hidden">
      <WinnerCelebration
        active={!!winner}
        winnerLabel={winner ? `${winner.nickname} wins!` : "Winner"}
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="text-center mb-8"
      >
        <motion.span
          className="text-6xl block mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          🎉
        </motion.span>
        <h1 className="text-4xl sm:text-6xl font-serif font-black">
          Game Over!
        </h1>
      </motion.div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-8 max-w-lg w-full">
        {[1, 0, 2].map((podiumIndex) => {
          const entry = top3[podiumIndex];
          if (!entry) return <div key={podiumIndex} className="flex-1" />;

          const heights = ["h-32 sm:h-40", "h-40 sm:h-52", "h-24 sm:h-32"];
          return (
            <motion.div
              key={entry.player_id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + podiumIndex * 0.2 }}
              className="flex-1 flex flex-col items-center"
            >
              <span className="text-3xl mb-2">{MEDALS[entry.rank - 1]}</span>
              <p className="font-serif font-bold text-sm truncate max-w-full mb-1">
                {entry.nickname}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {entry.score.toLocaleString()} pts
              </p>
              <div className={`w-full ${heights[podiumIndex]} rounded-t-xl gradient-primary`} />
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            reset();
            router.push("/dashboard");
          }}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
