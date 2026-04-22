// ─────────────────────────────────────────────────────────────
// QuizArena — Host Question Screen
// Shows question, options, timer, and answer count.
// ─────────────────────────────────────────────────────────────

"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/stores/useGameStore";
import { OPTION_COLORS } from "@quizarena/shared";

export default function HostQuestion() {
  const { session, currentQuestion, answeredCount, timeLeft } = useGameStore();

  if (!session || !currentQuestion) return null;

  const totalQuestions = session.questions_snapshot?.length || 0;
  const qIndex = session.current_q_index;
  const isEvaluating = session.status === "evaluating";

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
      <div className="bg-card rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">Answers</p>
        <p className="text-3xl font-display font-black">
          <span className="text-quiz-green">{answeredCount}</span>
          <span className="text-muted-foreground"> / </span>
          <span>{session.player_count}</span>
        </p>
      </div>
    </div>
  );
}
