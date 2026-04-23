// ─────────────────────────────────────────────────────────────
// QuizArena — Player Question Screen
// Shows question + tappable answer options.
// ─────────────────────────────────────────────────────────────

"use client";

import { motion } from "framer-motion";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { OPTION_COLORS } from "@quizarena/shared";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function PlayerQuestion() {
  const {
    session,
    currentQuestion,
    timeLeft,
    hasAnswered,
    selectedOption,
    answerResult,
    submitAnswer,
  } = usePlayerStore();

  if (!session || !currentQuestion) return null;

  const totalQuestions = session.questions_snapshot?.length || 0;
  const qIndex = session.current_q_index;

  // Already answered — show result
  if (hasAnswered && answerResult) {
    return (
      <div className="game-screen items-center justify-center gradient-dark px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md w-full"
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

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <p className="text-sm text-ens-slate-light">Points earned</p>
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
            Waiting for next question...
          </p>
        </motion.div>
      </div>
    );
  }

  // Time's up and haven't answered
  if (timeLeft <= 0 && !hasAnswered) {
    return (
      <div className="game-screen items-center justify-center gradient-dark px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <Clock className="w-20 h-20 mx-auto text-muted-foreground" />
          <h2 className="text-3xl font-serif font-black">Time&apos;s Up!</h2>
          <p className="text-muted-foreground">You didn&apos;t answer in time</p>
          <p className="text-muted-foreground text-sm animate-pulse">
            Waiting for next question...
          </p>
        </motion.div>
      </div>
    );
  }

  // Show question + options
  return (
    <div className="game-screen p-4 gradient-dark">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-serif text-ens-slate-light">
          {qIndex + 1} / {totalQuestions}
        </span>
        <div
          className={`text-3xl font-serif font-black ${
            timeLeft <= 5 ? "text-quiz-red animate-pulse" : ""
          }`}
        >
          {timeLeft}
        </div>
      </div>

      {/* Question text */}
      <motion.div
        key={qIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4 text-center mb-4"
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

      {/* Options — full screen tappable buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
        {currentQuestion.options.map((opt, i) => {
          const color = OPTION_COLORS[i];
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => submitAnswer(i)}
              disabled={hasAnswered}
              className="rounded-xl p-5 flex items-center justify-center text-white
                        font-sans font-bold text-lg shadow-ens-lg active:scale-95
                        transition-transform disabled:opacity-50"
              style={{ backgroundColor: color.bg }}
            >
              <span className="mr-2 opacity-80 text-xl">{color.shape}</span>
              <span className="line-clamp-2">{opt.text}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
