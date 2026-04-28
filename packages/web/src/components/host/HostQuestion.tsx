// ─────────────────────────────────────────────────────────────
// Tokupojomo — Host Question Screen
// Shows question, options, timer, answer count, and
// presenter controls (end question / show leaderboard / skip).
// ─────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/stores/useGameStore";
import { Button } from "@/components/ui/button";
import BrandedBackground from "@/components/ui/BrandedBackground";
import { OPTION_COLORS } from "@quizarena/shared";
import { SkipForward, BarChart3, StopCircle, Users } from "lucide-react";

const OPTION_BG_CLASSES = ["bg-quiz-red", "bg-quiz-blue", "bg-quiz-yellow", "bg-quiz-green"];
const BAR_HEIGHT_CLASSES = ["h-[4%]", "h-[12%]", "h-[24%]", "h-[36%]", "h-[48%]", "h-[60%]", "h-[72%]", "h-[84%]", "h-[96%]"];
const BAR_WIDTH_CLASSES = ["w-[4%]", "w-[12%]", "w-[24%]", "w-[36%]", "w-[48%]", "w-[60%]", "w-[72%]", "w-[84%]", "w-full"];

function bucketBarHeight(percent: number) {
  if (percent <= 0) return BAR_HEIGHT_CLASSES[0];
  const bucket = Math.min(BAR_HEIGHT_CLASSES.length - 1, Math.floor(percent / 12.5));
  return BAR_HEIGHT_CLASSES[bucket];
}

function bucketBarWidth(percent: number) {
  if (percent <= 0) return BAR_WIDTH_CLASSES[0];
  const bucket = Math.min(BAR_WIDTH_CLASSES.length - 1, Math.floor(percent / 12.5));
  return BAR_WIDTH_CLASSES[bucket];
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
  const completion = session.player_count > 0 ? Math.min(100, (answeredCount / session.player_count) * 100) : 0;

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
      <BrandedBackground imagePath="/designs/backgrounds/Template.avif" className="z-0" />
      <div className="relative z-10 mb-4 sm:mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass rounded-xl border border-white/15 p-4">
          <p className="text-xs uppercase tracking-wider text-white/60">Question</p>
          <p className="text-2xl font-serif font-black mt-1">{qIndex + 1}<span className="text-white/50">/{totalQuestions}</span></p>
        </div>
        <div className="glass rounded-xl border border-white/15 p-4">
          <p className="text-xs uppercase tracking-wider text-white/60">Timer</p>
          <p className={`text-2xl sm:text-3xl font-serif font-black mt-1 ${timeLeft <= 5 ? "text-quiz-red animate-pulse" : "text-white"}`}>
            {timeLeft}s
          </p>
        </div>
        <div className="glass rounded-xl border border-white/15 p-4">
          <p className="text-xs uppercase tracking-wider text-white/60">Responses</p>
          <p className="text-2xl font-serif font-black mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#EEDC00]" />
            {answeredCount}<span className="text-white/50">/{session.player_count}</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 mb-4 sm:mb-6 glass rounded-xl border border-white/15 p-3">
        <div className="flex items-center justify-between text-xs text-white/65 mb-2">
          <span>Answer progress</span>
          <span>{Math.round(completion)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full gradient-primary transition-all duration-300 ${bucketBarWidth(completion)}`} />
        </div>
      </div>

      {/* Question */}
      <motion.div
        key={qIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 sm:p-8 text-center mb-4 sm:mb-6 border border-white/15 relative z-10"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 flex-1 mb-4 sm:mb-6 relative z-10">
        {currentQuestion.options.map((opt, i) => {
          const color = OPTION_COLORS[i];
          const bgClass = OPTION_BG_CLASSES[i] ?? "bg-primary";
          const showCorrect = isEvaluating && opt.is_correct;
          const showWrong = isEvaluating && !opt.is_correct;
          const count = answerDistribution[i] ?? 0;
          const pct = answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl p-4 sm:p-5 text-white
                         font-sans font-bold shadow-ens-lg border border-white/10
                         transition-opacity ${showWrong ? "opacity-40" : ""} ${bgClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-white/70 mb-1">Option {i + 1}</p>
                  <p className="text-base sm:text-xl md:text-2xl leading-snug">
                    <span className="mr-2 sm:mr-3 opacity-80">{color.shape}</span>
                    <span className="line-clamp-2">{opt.text}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-white/75">{count} · {pct}%</p>
                  {showCorrect && <span className="text-xl">✓</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Answer counter + distribution */}
      <div className="glass rounded-xl p-4 text-center mb-4 border border-white/15 relative z-10">
        <p className="text-sm text-white/70">Live Distribution</p>
        <p className="text-xl font-serif font-black mt-1">
          {isEvaluating ? "Question Closed" : "Receiving Answers"}
        </p>
        {timerDone && !isEvaluating && (
          <p className="text-xs text-[#EEDC00] mt-1 animate-pulse">
            Waiting for presenter...
          </p>
        )}
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
      <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
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
