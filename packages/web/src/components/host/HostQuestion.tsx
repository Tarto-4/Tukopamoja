// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Host Question Screen
// Shows question, options, timer, answer count, and
// presenter controls (end question / show leaderboard / skip).
// ─────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/stores/useGameStore";
import { Button } from "@/components/ui/button";
import BrandedBackground from "@/components/ui/BrandedBackground";
import { OPTION_COLORS } from "@tukopamoja/shared";
import { SkipForward, BarChart3, StopCircle, Users } from "lucide-react";

const BAR_WIDTH_CLASSES = ["w-[4%]", "w-[12%]", "w-[24%]", "w-[36%]", "w-[48%]", "w-[60%]", "w-[72%]", "w-[84%]", "w-full"];
const BAR_HEIGHT_CLASSES = ["h-[4%]", "h-[12%]", "h-[24%]", "h-[36%]", "h-[48%]", "h-[60%]", "h-[72%]", "h-[84%]", "h-[96%]"];
const OPTION_BG_CLASSES = ["bg-quiz-red", "bg-quiz-blue", "bg-quiz-yellow", "bg-quiz-green"];
const OPTION_TEXT_CLASSES = ["text-white", "text-white", "text-[#1a1200]", "text-white"];
const OPTION_SHADOW_CLASSES = [
  "shadow-[0_4px_0_rgba(0,0,0,0.38)]",
  "shadow-[0_4px_0_rgba(0,0,0,0.38)]",
  "shadow-[0_4px_0_rgba(0,0,0,0.38)]",
  "shadow-[0_4px_0_rgba(0,0,0,0.38)]",
];

function bucketBarWidth(percent: number) {
  if (percent <= 0) return BAR_WIDTH_CLASSES[0];
  const bucket = Math.min(BAR_WIDTH_CLASSES.length - 1, Math.floor(percent / 12.5));
  return BAR_WIDTH_CLASSES[bucket];
}

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
        <div className="stat-tile">
          <p className="stat-tile__label">Question</p>
          <p className="stat-tile__value">{qIndex + 1}<span className="text-muted-foreground opacity-60">/{totalQuestions}</span></p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile__label">Timer</p>
          <p className={`stat-tile__value ${timeLeft <= 5 ? "animate-[timer-critical_0.6s_ease-in-out_infinite]" : ""}`}>
            {timeLeft}s
          </p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile__label">Responses</p>
          <p className="stat-tile__value flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {answeredCount}<span className="opacity-55">/{session.player_count}</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 mb-4 sm:mb-6 glass rounded-xl border border-white/10 p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Answer progress</span>
          <span className="font-mono">{Math.round(completion)}%</span>
        </div>
        <div className="timer-bar-track">
          <div className={`timer-bar-fill ${bucketBarWidth(completion)}`} />
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
          const showCorrect = isEvaluating && opt.is_correct;
          const showWrong  = isEvaluating && !opt.is_correct;
          const count = answerDistribution[i] ?? 0;
          const pct   = answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0;
          const bgClass = OPTION_BG_CLASSES[i] ?? "bg-primary";
          const textClass = OPTION_TEXT_CLASSES[i] ?? "text-white";
          const shadowClass = OPTION_SHADOW_CLASSES[i] ?? "";
          const miniWidth = bucketBarWidth(Math.max(4, pct));

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`${bgClass} ${textClass} ${shadowClass} rounded-2xl p-4 sm:p-5 font-bold border-2 transition-all duration-300 ${
                showWrong   ? "opacity-35 saturate-50" : ""
              } ${showCorrect ? "border-[rgba(0,230,118,0.8)] shadow-correct-glow" : "border-[rgba(255,255,255,0.15)]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider opacity-65 mb-1.5">
                    {color.shape} Option {i + 1}
                  </p>
                  <p className={`text-base sm:text-xl md:text-2xl leading-snug font-bold ${i === 2 ? "" : "drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]"}`}>
                    {opt.text}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-mono tabular-nums opacity-80">
                    {count} <span className="opacity-70">({pct}%)</span>
                  </p>
                  {showCorrect && <span className="text-xl block mt-1">✓</span>}
                </div>
              </div>
              {/* Mini bar showing selection share */}
              {answeredCount > 0 && (
                <div className="mt-3 h-1.5 rounded-full bg-black/20 overflow-hidden">
                  <div className={`h-full rounded-full bg-white/60 transition-all duration-500 ${miniWidth}`} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Answer counter + distribution */}
      <div className="glass rounded-xl p-4 text-center mb-4 border border-white/10 relative z-10">
        <p className="text-sm text-muted-foreground uppercase tracking-wider">Live Distribution</p>
        <p className="text-xl font-serif font-black mt-1">
          {isEvaluating ? "Question Closed" : "Receiving Answers"}
        </p>
        {timerDone && !isEvaluating && (
          <p className="text-xs text-primary mt-1 game-pulse">Waiting for presenter…</p>
        )}
        {allAnswered && !isEvaluating && (
          <p className="text-xs mt-1 text-game-correct">All players answered!</p>
        )}

        {/* Answer distribution bars */}
        {answeredCount > 0 && (
          <div className="mt-3 flex items-end justify-center gap-2 h-14">
            {currentQuestion.options.map((_, i) => {
              const count = answerDistribution[i] ?? 0;
              const pct   = answeredCount > 0 ? (count / answeredCount) * 100 : 0;
              const color = OPTION_COLORS[i];
              const barHeightClass = bucketBarHeight(Math.max(4, pct));
              const barColorClass = OPTION_BG_CLASSES[i] ?? "bg-primary";
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1 max-w-14">
                  <span className="text-xs font-mono tabular-nums text-muted-foreground">{count}</span>
                  <div className={`w-full rounded-t transition-all duration-500 min-h-[3px] ${barHeightClass} ${barColorClass}`} />
                  <span className="text-[10px] text-muted-foreground">{color.shape}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Presenter Controls ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
        <Button
          size="lg"
          variant={timerDone || allAnswered ? "game" : "outline"}
          disabled={loading}
          onClick={() => handleAction(showLeaderboard, "show leaderboard")}
          className={
            timerDone || allAnswered
              ? "ready-glow transition-shadow duration-700"
              : ""
          }
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {loading ? "Loading…" : "Show Leaderboard"}
        </Button>

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

        <Button
          size="lg"
          variant="game-danger"
          disabled={loading}
          onClick={() => handleAction(endGame, "end game")}
        >
          <StopCircle className="w-4 h-4 mr-2" />
          End Game
        </Button>
      </div>

      {error && (
        <p className="text-sm text-center mt-3 text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
