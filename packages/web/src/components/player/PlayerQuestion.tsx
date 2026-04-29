// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Player Question Screen
// Shows question + tappable answer options.
// ─────────────────────────────────────────────────────────────

"use client";

import { motion } from "framer-motion";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { OPTION_COLORS } from "@quizarena/shared";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import BrandedBackground from "@/components/ui/BrandedBackground";

const BAR_WIDTH_CLASSES = ["w-[4%]", "w-[12%]", "w-[24%]", "w-[36%]", "w-[48%]", "w-[60%]", "w-[72%]", "w-[84%]", "w-full"];

function bucketBarWidth(percent: number) {
  if (percent <= 0) return BAR_WIDTH_CLASSES[0];
  const bucket = Math.min(BAR_WIDTH_CLASSES.length - 1, Math.floor(percent / 12.5));
  return BAR_WIDTH_CLASSES[bucket];
}

export default function PlayerQuestion() {
  const {
    session,
    currentQuestion,
    timeLeft,
    timeLeftMs,
    hasAnswered,
    selectedOption,
    answerResult,
    submitAnswer,
  } = usePlayerStore();

  if (!session || !currentQuestion) return null;

  const totalQuestions = session.questions_snapshot?.length || 0;
  const qIndex = session.current_q_index;
  const progress = totalQuestions > 0 ? ((qIndex + 1) / totalQuestions) * 100 : 0;
  const smoothTimerLabel = timeLeftMs > 0 && timeLeftMs < 10000
    ? `${(timeLeftMs / 1000).toFixed(1)}s`
    : `${timeLeft}s`;

  // Already answered — show result
  if (hasAnswered && answerResult) {
    return (
      <div className="game-screen items-center justify-center gradient-dark px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
        <BrandedBackground imagePath="/designs/backgrounds/Sessions.avif" className="z-0" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md w-full relative z-10"
        >
          {answerResult.isCorrect ? (
            <>
              <CheckCircle className="w-20 h-20 mx-auto text-quiz-green" />
              <h2 className="text-3xl font-serif font-black text-quiz-green">
                Correct!
              </h2>
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 mx-auto text-quiz-red" />
              <h2 className="text-3xl font-serif font-black text-quiz-red">
                Wrong
              </h2>
            </>
          )}

          <div className="glass rounded-2xl p-6 space-y-3 border border-white/15">
            <p className="text-sm text-white/70">Points earned</p>
            <p className="text-4xl font-serif font-black">
              +{answerResult.pointsAwarded}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Total: {answerResult.totalScore}</span>
              {answerResult.streak > 1 && (
                <span className="text-quiz-yellow">
                  🔥 {answerResult.streak} streak
                </span>
              )}
            </div>
          </div>

          <p className="text-muted-foreground text-sm animate-pulse">
            Waiting for presenter...
          </p>
        </motion.div>
      </div>
    );
  }

  // Time's up and haven't answered
  if (timeLeft <= 0 && !hasAnswered) {
    return (
      <div className="game-screen items-center justify-center gradient-dark px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
        <BrandedBackground imagePath="/designs/backgrounds/Sessions.avif" className="z-0" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 relative z-10"
        >
          <Clock className="w-20 h-20 mx-auto text-muted-foreground" />
          <h2 className="text-3xl font-serif font-black">Time&apos;s Up!</h2>
          <p className="text-muted-foreground">You didn&apos;t answer in time</p>
          <p className="text-muted-foreground text-sm animate-pulse">
            Waiting for presenter...
          </p>
        </motion.div>
      </div>
    );
  }

  // Show question + options
  return (
    <div className="game-screen p-4 gradient-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <BrandedBackground imagePath="/designs/backgrounds/Sessions.avif" className="z-0" />
      <div className="relative z-10 mb-3 rounded-2xl glass px-4 py-3 border border-white/15">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-white/60">Question {qIndex + 1} of {totalQuestions}</span>
          <div className={`text-2xl sm:text-3xl font-serif font-black ${timeLeft <= 5 ? "text-quiz-red animate-pulse" : "text-white"}`}>
            {smoothTimerLabel}
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full gradient-primary transition-all duration-300 ${bucketBarWidth(progress)}`} />
        </div>
      </div>

      {/* Question text */}
      <motion.div
        key={qIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 text-center mb-4 border border-white/15 relative z-10"
      >
        <h2 className="text-lg sm:text-xl font-serif font-bold leading-tight">
          {currentQuestion.question_text}
        </h2>
        {currentQuestion.image_url && (
          <img
            src={currentQuestion.image_url}
            alt=""
            className="max-h-32 mx-auto mt-3 rounded-lg object-contain"
          />
        )}
      </motion.div>

      {/* Options — compact tappable buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 relative z-10">
        {currentQuestion.options.map((opt, i) => {
          const color = OPTION_COLORS[i];
          const isSelected = selectedOption === i;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => submitAnswer(i)}
              disabled={hasAnswered}
              style={{ backgroundColor: color.bg }}
              className={`rounded-xl px-4 py-3 text-left text-white
                        font-sans font-semibold text-base shadow-md active:scale-[0.97] border border-white/10
                        transition-transform disabled:opacity-50 ${isSelected ? "ring-2 ring-white/80" : ""}`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="opacity-80 text-lg shrink-0">{color.shape}</span>
                  <span className="line-clamp-2 text-sm sm:text-base leading-snug">{opt.text}</span>
                </div>
                {isSelected && <span className="text-xs text-white/90 shrink-0">✓</span>}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
