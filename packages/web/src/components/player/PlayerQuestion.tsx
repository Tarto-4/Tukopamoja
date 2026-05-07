// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Player Question Screen
// Shows question + tappable answer options.
// ─────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useBrandingStore } from "@/stores/useBrandingStore";
import { OPTION_COLORS } from "@tukopamoja/shared";
import { CheckCircle, XCircle, Clock, Send } from "lucide-react";
import BrandedBackground from "@/components/ui/BrandedBackground";

const BAR_WIDTH_CLASSES = ["w-[4%]", "w-[12%]", "w-[24%]", "w-[36%]", "w-[48%]", "w-[60%]", "w-[72%]", "w-[84%]", "w-full"];
const ANSWER_BG_CLASSES = ["bg-quiz-red", "bg-quiz-blue", "bg-quiz-yellow", "bg-quiz-green"];
const ANSWER_SELECTED_SHADOW_CLASSES = [
  "shadow-[0_0_0_3px_rgba(255,255,255,0.85),0_6px_0_rgba(0,0,0,0.38),0_0_24px_rgba(232,0,62,0.55)]",
  "shadow-[0_0_0_3px_rgba(255,255,255,0.85),0_6px_0_rgba(0,0,0,0.38),0_0_24px_rgba(10,98,255,0.55)]",
  "shadow-[0_0_0_3px_rgba(255,255,255,0.85),0_6px_0_rgba(0,0,0,0.38),0_0_24px_rgba(255,159,0,0.55)]",
  "shadow-[0_0_0_3px_rgba(255,255,255,0.85),0_6px_0_rgba(0,0,0,0.38),0_0_24px_rgba(0,168,84,0.55)]",
];

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
    selectedAnswerText,
    answerResult,
    submitAnswer,
    submitTextAnswer,
  } = usePlayerStore();

  const [textInput, setTextInput] = useState("");
  const { branding } = useBrandingStore();

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
        <BrandedBackground imagePath="/designs/backgrounds/dt-wallpaper.png" className="z-0" />
        {branding?.logo_url && (
          <div className="absolute top-4 left-4 flex items-center gap-2 z-30">
            <img src={branding.logo_url} alt={branding.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded object-contain" />
          </div>
        )}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="text-center space-y-6 max-w-md w-full relative z-10"
        >
          {answerResult.isCorrect ? (
            <>
              <div className="relative inline-block">
                <CheckCircle className="w-20 h-20 sm:w-[88px] sm:h-[88px] mx-auto text-game-correct drop-shadow-[0_0_28px_rgba(0,201,110,0.7)]" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-game-correct">
                Correct! ✓
              </h2>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-game-wrong drop-shadow-[0_0_24px_rgba(255,36,83,0.65)]" />
              <h2 className="text-3xl sm:text-4xl font-bold text-game-wrong">
                Wrong ✗
              </h2>
            </>
          )}

          <div className="rounded-2xl p-6 space-y-4 bg-card border border-border shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Points earned</p>
            <p className="text-5xl font-bold text-primary">
              +{answerResult.pointsAwarded.toLocaleString()}
            </p>
            <div className="flex items-center justify-center gap-5 text-sm">
              <span className="text-muted-foreground">
                Total: <span className="font-medium text-foreground">{answerResult.totalScore.toLocaleString()}</span>
              </span>
              {answerResult.streak > 1 && (
                <span className="font-bold text-game-streak">
                  🔥 {answerResult.streak}× streak
                </span>
              )}
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            Waiting for presenter…
          </p>
        </motion.div>
      </div>
    );
  }

  // Time's up and haven't answered
  if (timeLeft <= 0 && !hasAnswered) {
    return (
      <div className="game-screen items-center justify-center gradient-dark px-4 relative overflow-hidden">
        <BrandedBackground imagePath="/designs/backgrounds/dt-wallpaper.png" className="z-0" />
        {branding?.logo_url && (
          <div className="absolute top-4 left-4 flex items-center gap-2 z-30">
            <img src={branding.logo_url} alt={branding.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded object-contain" />
          </div>
        )}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 relative z-10"
        >
          <Clock className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-muted-foreground" />
          <h2 className="text-2xl sm:text-3xl font-bold">Time&apos;s Up!</h2>
          <p className="text-muted-foreground">You didn&apos;t answer in time</p>
          <p className="text-muted-foreground text-sm">
            Waiting for presenter…
          </p>
        </motion.div>
      </div>
    );
  }

  // Show question + options
  return (
    <div className="game-screen p-4 gradient-dark relative overflow-hidden">
      <BrandedBackground imagePath="/designs/backgrounds/dt-wallpaper.png" className="z-0" />
      {branding?.logo_url && (
        <div className="absolute top-4 right-4 z-30">
          <img src={branding.logo_url} alt={branding.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded object-contain" />
        </div>
      )}

      {/* Progress / timer header */}
      <div className="relative z-10 mb-4 rounded-2xl bg-card px-5 py-4 border border-border shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Q {qIndex + 1} / {totalQuestions}
          </span>
          <span
            className={`text-2xl sm:text-3xl font-bold tabular-nums ${
              timeLeft <= 5 ? "animate-[timer-critical_0.6s_ease-in-out_infinite]" : "text-foreground"
            }`}
          >
            {smoothTimerLabel}
          </span>
        </div>
        {/* Timer progress bar */}
        <div className="timer-bar-track">
          <div
            className={`timer-bar-fill ${timeLeft <= 5 ? "timer-bar-fill--critical" : ""} ${bucketBarWidth(progress)}`}
          />
        </div>
      </div>

      {/* Question text */}
      <motion.div
        key={qIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 sm:p-6 text-center mb-4 bg-card border border-border shadow-[0px_2px_8px_rgba(0,0,0,0.06)] relative z-10"
      >
        <h2 className="text-lg sm:text-xl font-medium leading-snug text-foreground">
          {currentQuestion.question_text}
        </h2>
        {currentQuestion.image_url && (
          <img
            src={currentQuestion.image_url}
            alt={`Illustration for: ${currentQuestion.question_text}`}
            loading="lazy"
            className="max-h-28 sm:max-h-36 mx-auto mt-4 rounded-xl object-contain"
          />
        )}
      </motion.div>

      {/* Answer area */}
      {currentQuestion.question_type === "text_input" ? (
        /* ─── Text Input Answer ─── */
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 relative z-10 flex flex-col gap-3"
        >
          <div className="rounded-2xl bg-card border border-border p-4 sm:p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.06)] flex flex-col gap-3 flex-1">
            <label htmlFor="text-answer" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Type your answer
            </label>
            <input
              id="text-answer"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && textInput.trim()) {
                  submitTextAnswer(textInput);
                }
              }}
              disabled={hasAnswered}
              placeholder="Enter your answer…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={200}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
              aria-label="Type your answer to the question"
            />
            <button
              onClick={() => submitTextAnswer(textInput)}
              disabled={hasAnswered || !textInput.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground font-semibold text-lg transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_rgba(0,0,0,0.38)] active:shadow-[0_2px_0_rgba(0,0,0,0.38)] active:translate-y-[2px]"
              aria-label="Submit your answer"
            >
              <Send className="w-5 h-5" />
              Submit
            </button>
          </div>
        </motion.div>
      ) : (
        /* ─── Multiple Choice / True-False Answer Tiles ─── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 relative z-10">
          {currentQuestion.options.map((opt, i) => {
            const color = OPTION_COLORS[i];
            const isSelected = selectedOption === i;
            const isYellow = color.name === "yellow";
            const bgClass = ANSWER_BG_CLASSES[i] ?? "bg-primary";
            const selectedShadowClass = ANSWER_SELECTED_SHADOW_CLASSES[i] ?? "";
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => submitAnswer(i)}
                disabled={hasAnswered}
                className={`answer-btn min-h-[48px] ${bgClass} ${isYellow ? "answer-btn--yellow" : ""} ${isSelected ? `answer-btn--selected ${selectedShadowClass}` : "shadow-[0_4px_0_rgba(0,0,0,0.38)]"}`}
                aria-pressed={isSelected}
              >
                <span className="answer-btn__shape" aria-hidden="true">{color.shape}</span>
                <span className="answer-btn__text">{opt.text}</span>
                {isSelected && (
                  <span className="ml-1 text-base shrink-0" aria-hidden="true">✓</span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
