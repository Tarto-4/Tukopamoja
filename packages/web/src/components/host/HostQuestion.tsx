// ─────────────────────────────────────────────────────────────
// QuizArena — Host Question Screen
// Shows question, options, timer, answer count, and
// presenter controls (end question / show leaderboard / skip).
// ─────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/stores/useGameStore";
import { Button } from "@/components/ui/button";
import { OPTION_COLORS } from "@quizarena/shared";
import { SkipForward, BarChart3, StopCircle } from "lucide-react";

export default function HostQuestion() {
  const {
    session,
    currentQuestion,
    answeredCount,
    timeLeft,
    showLeaderboard,
    nextQuestion,
    endGame,
    stopTimer,
  } = useGameStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session || !currentQuestion) return null;

  const totalQuestions = session.questions_snapshot?.length || 0;
  const qIndex = session.current_q_index;
  const isEvaluating = session.status === "evaluating";
  const isLastQuestion = qIndex >= totalQuestions - 1;
  const allAnswered = answeredCount >= session.player_count && session.player_count > 0;
  const timerDone = timeLeft <= 0;

  // Shared action handler with loading + error guard
  async function handleAction(action: () => Promise<void>, label: string) {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      stopTimer();
      await action();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${label}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="game-screen p-4 sm:p-8 gradient-dark">
      {/* Top bar: progress + timer */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <span className="text-sm font-display text-muted-foreground">
          Question {qIndex + 1} / {totalQuestions}
        </span>
        <div
          className={`text-4xl sm:text-5xl font-display font-black ${
            timeLeft <= 5 ? "text-quiz-red animate-pulse" : ""
          }`}
        >
          {timeLeft}
        </div>
      </div>

      {/* Question */}
      <motion.div
        key={qIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-6 sm:p-8 text-center mb-6 sm:mb-8"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold leading-tight">
          {currentQuestion.question_text}
        </h2>
        {currentQuestion.image_url && (
          <img
            src={currentQuestion.image_url}
            alt=""
            className="max-h-48 mx-auto mt-4 rounded-lg object-contain"
          />
        )}
      </motion.div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 mb-4 sm:mb-6">
        {currentQuestion.options.map((opt, i) => {
          const color = OPTION_COLORS[i];
          const showCorrect = isEvaluating && opt.is_correct;
          const showWrong = isEvaluating && !opt.is_correct;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl p-4 sm:p-6 flex items-center justify-center text-white
                         font-display font-bold text-base sm:text-xl md:text-2xl shadow-lg
                         transition-opacity ${showWrong ? "opacity-40" : ""}`}
              style={{ backgroundColor: color.bg }}
            >
              <span className="mr-2 sm:mr-3 opacity-80">{color.shape}</span>
              <span className="line-clamp-2">{opt.text}</span>
              {showCorrect && <span className="ml-2 text-2xl">✓</span>}
            </motion.div>
          );
        })}
      </div>

      {/* Answer counter */}
      <div className="bg-card rounded-xl p-4 text-center mb-4">
        <p className="text-sm text-muted-foreground">Answers</p>
        <p className="text-3xl font-display font-black">
          <span className="text-quiz-green">{answeredCount}</span>
          <span className="text-muted-foreground"> / </span>
          <span>{session.player_count}</span>
        </p>
        {allAnswered && (
          <p className="text-xs text-quiz-green mt-1">All players answered!</p>
        )}
      </div>

      {/* ─── Presenter Controls ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Show Leaderboard — primary action when timer done or all answered */}
        <Button
          size="lg"
          disabled={loading}
          onClick={() => handleAction(showLeaderboard, "show leaderboard")}
          className={`${
            timerDone || allAnswered
              ? "gradient-primary border-0 animate-pulse"
              : "bg-card border hover:bg-accent"
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {loading ? "Loading..." : "Show Leaderboard"}
        </Button>

        {/* Skip to next question */}
        {!isLastQuestion && (
          <Button
            size="lg"
            variant="outline"
            disabled={loading}
            onClick={() => handleAction(nextQuestion, "skip question")}
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip to Next
          </Button>
        )}

        {/* End game early */}
        <Button
          size="lg"
          variant="destructive"
          disabled={loading}
          onClick={() => handleAction(endGame, "end game")}
        >
          <StopCircle className="w-4 h-4 mr-2" />
          End Game
        </Button>
      </div>

      {/* Error feedback */}
      {error && (
        <p className="text-sm text-quiz-red text-center mt-3" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
