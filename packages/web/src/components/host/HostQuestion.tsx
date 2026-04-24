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

const OPTION_BG_CLASSES = ["bg-quiz-red", "bg-quiz-blue", "bg-quiz-yellow", "bg-quiz-green"];
const BAR_HEIGHT_CLASSES = ["h-[4%]", "h-[12%]", "h-[24%]", "h-[36%]", "h-[48%]", "h-[60%]", "h-[72%]", "h-[84%]", "h-[96%]"];

function bucketBarHeight(percent: number) {
  if (percent <= 0) return BAR_HEIGHT_CLASSES[0];
  const bucket = Math.min(BAR_HEIGHT_CLASSES.length - 1, Math.floor(percent / 12.5));
  return BAR_HEIGHT_CLASSES[bucket];
}

export default function HostQuestion() {
  const {
    session,
    currentQuestion,
    answeredCount,
    answerDistribution,
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
    <div className="game-screen p-4 sm:p-8 gradient-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      {/* Top bar: progress + timer */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10 rounded-2xl glass px-5 py-4 border border-white/15">
        <span className="text-sm font-serif text-white/70">
          Question {qIndex + 1} / {totalQuestions}
        </span>
        <div
          className={`text-4xl sm:text-5xl font-serif font-black ${
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
        className="glass rounded-2xl p-6 sm:p-8 text-center mb-6 sm:mb-8 border border-white/15 relative z-10"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold leading-tight">
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
          const bgClass = OPTION_BG_CLASSES[i] ?? "bg-primary";
          const showCorrect = isEvaluating && opt.is_correct;
          const showWrong = isEvaluating && !opt.is_correct;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl p-4 sm:p-6 flex items-center justify-center text-white
                         font-sans font-bold text-base sm:text-xl md:text-2xl shadow-ens-lg border border-white/10
                         transition-opacity ${showWrong ? "opacity-40" : ""} ${bgClass}`}
            >
              <span className="mr-2 sm:mr-3 opacity-80">{color.shape}</span>
              <span className="line-clamp-2">{opt.text}</span>
              {showCorrect && <span className="ml-2 text-2xl">✓</span>}
            </motion.div>
          );
        })}
      </div>

      {/* Answer counter + distribution */}
      <div className="glass rounded-xl p-4 text-center mb-4 border border-white/15 relative z-10">
        <p className="text-sm text-white/70">Answers</p>
        <p className="text-3xl font-serif font-black">
          <span className="text-quiz-green">{answeredCount}</span>
          <span className="text-muted-foreground"> / </span>
          <span>{session.player_count}</span>
        </p>
        {allAnswered && (
          <p className="text-xs text-quiz-green mt-1">All players answered!</p>
        )}

        {/* Answer distribution bars */}
        {answeredCount > 0 && (
          <div className="mt-3 flex items-end justify-center gap-2 h-12">
            {currentQuestion.options.map((_, i) => {
              const count = answerDistribution[i] ?? 0;
              const pct = answeredCount > 0 ? (count / answeredCount) * 100 : 0;
              const color = OPTION_COLORS[i];
              const barHeightClass = bucketBarHeight(Math.max(4, pct));
              const barColorClass = OPTION_BG_CLASSES[i] ?? "bg-primary";
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1 max-w-16">
                  <span className="text-xs font-mono tabular-nums">{count}</span>
                  <div className={`w-full rounded-t transition-all duration-300 min-h-[2px] ${barColorClass} ${barHeightClass}`} />
                  <span className="text-[10px] opacity-60">{color.shape}</span>
                </div>
              );
            })}
          </div>
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
              ? "gradient-primary border-0 animate-pulse-glow btn-3d text-black"
              : "glass border-white/15 hover:bg-white/10"
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
