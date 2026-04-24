// ─────────────────────────────────────────────────────────────
// QuizArena — Host Leaderboard View
// ─────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/stores/useGameStore";
import { Button } from "@/components/ui/button";
import { MEDALS } from "@quizarena/shared";

export default function HostLeaderboard() {
  const { session, leaderboard, nextQuestion } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session) return null;

  const totalQuestions = session.questions_snapshot?.length || 0;
  const isLastQuestion = session.current_q_index >= totalQuestions - 1;

  return (
    <div className="game-screen items-center justify-center gradient-dark p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl sm:text-5xl font-serif font-black mb-2 relative z-10"
      >
        🏆 Leaderboard
      </motion.h1>
      <p className="text-muted-foreground mb-6 sm:mb-8 relative z-10">
        After question {session.current_q_index + 1} of {totalQuestions}
      </p>

      {/* Rankings */}
      <div className="w-full max-w-lg space-y-2 sm:space-y-3 mb-6 sm:mb-8 max-h-[50vh] overflow-y-auto relative z-10 rounded-2xl glass p-4 border border-white/15">
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.player_id}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex items-center gap-3 sm:gap-4 rounded-xl p-3 sm:p-4 bg-white/5 border border-white/10"
          >
            <div className="w-10 text-center">
              {entry.rank <= 3 ? (
                <span className="text-2xl">{MEDALS[entry.rank - 1]}</span>
              ) : (
                <span className="text-lg font-serif font-bold text-ens-slate-light">
                  #{entry.rank}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif font-bold truncate text-sm sm:text-base">
                {entry.avatar} {entry.nickname}
              </p>
              {entry.streak > 1 && (
                <p className="text-xs text-orange-400">
                  🔥 {entry.streak} streak
                </p>
              )}
            </div>
            <span className="text-lg sm:text-xl font-serif font-black">
              {entry.score.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>

      <Button
        size="xl"
        disabled={loading}
        onClick={async () => {
          if (loading) return;
          setLoading(true);
          setError("");
          try {
            await nextQuestion();
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to advance");
          } finally {
            setLoading(false);
          }
        }}
        className="gradient-primary border-0 btn-3d text-black font-semibold relative z-10"
      >
        {loading
          ? "Loading..."
          : isLastQuestion
            ? "🏁 Finish Game"
            : "➡️ Next Question"}
      </Button>

      {error && (
        <p className="text-sm text-quiz-red text-center mt-3" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
