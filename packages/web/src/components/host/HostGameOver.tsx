// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Host Game Over Screen
// ─────────────────────────────────────────────────────────────

"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/useGameStore";
import { useBrandingStore } from "@/stores/useBrandingStore";
import { Button } from "@/components/ui/button";
import WinnerCelebration from "@/components/ui/WinnerCelebration";
import { MEDALS } from "@tukopamoja/shared";

export default function HostGameOver() {
  const router = useRouter();
  const { leaderboard, reset } = useGameStore();
  const { branding } = useBrandingStore();

  const top3 = leaderboard.slice(0, 3);
  const winner = top3[0];

  return (
    <div className="game-screen items-center justify-center gradient-dark p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      {/* Brand identity */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-30">
        {branding?.logo_url && (
          <img src={branding.logo_url} alt={branding.name} className="w-8 h-8 rounded object-contain" />
        )}
        <span className="text-xs font-semibold text-white/60">
          {branding?.name || "TUKOPAMOJA"}
        </span>
      </div>
      <WinnerCelebration
        active={!!winner}
        winnerLabel={winner ? `${winner.nickname} wins!` : "Winner"}
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="text-center mb-8 relative z-10"
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
      <div className="flex items-end justify-center gap-4 mb-8 max-w-lg w-full relative z-10 rounded-2xl glass p-6 border border-white/15">
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

      <div className="flex gap-4 relative z-10">
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            reset();
            router.push("/dashboard");
          }}
          className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
