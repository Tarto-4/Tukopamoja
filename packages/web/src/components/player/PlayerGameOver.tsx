// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Player Game Over
// ─────────────────────────────────────────────────────────────

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import WinnerCelebration from "@/components/ui/WinnerCelebration";
import { MEDALS } from "@tukopamoja/shared";
import { Trophy, RotateCcw, House, Sparkles, Users, TimerReset, Star } from "lucide-react";
import BrandedBackground from "@/components/ui/BrandedBackground";

export default function PlayerGameOver() {
  const router = useRouter();
  const { session, leaderboard, playerId, totalScore, rank, nickname, avatar, reset, submitFeedback } =
    usePlayerStore();
  const [countdown, setCountdown] = useState(10);
  const hasRedirected = useRef(false);

  // Feedback state
  const requireFeedback = session?.require_feedback ?? false;
  const feedbackScale = session?.feedback_scale ?? 5;
  const allowComment = session?.feedback_comment_enabled ?? false;
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const top5 = leaderboard.slice(0, 5);
  const isTop3 = rank !== null && rank <= 3;
  const isWinner = rank === 1;
  const playerCount = session?.player_count ?? leaderboard.length;
  const sessionPin = session?.pin;

  const handleReturnHome = useCallback(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    reset();
    router.push("/join");
  }, [reset, router]);

  const handlePlayAgain = useCallback(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    reset();
    router.push(sessionPin ? `/join/?pin=${sessionPin}` : "/join");
  }, [reset, router, sessionPin]);

  useEffect(() => {
    // Pause auto-redirect while feedback is pending
    if (requireFeedback && !feedbackSubmitted) return;

    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          handleReturnHome();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [handleReturnHome, requireFeedback, feedbackSubmitted]);

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4 py-6 relative overflow-hidden">
      <BrandedBackground className="z-0" />
      <WinnerCelebration active={isWinner} winnerLabel="Champion" />
      <div className="w-full max-w-2xl space-y-6 text-center relative z-10">
        {/* Celebration header */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="space-y-3"
        >
          {isTop3 ? (
            <span className="text-6xl sm:text-7xl block">{MEDALS[(rank ?? 1) - 1]}</span>
          ) : (
            <Trophy className="w-14 h-14 sm:w-16 sm:h-16 mx-auto text-primary" />
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Game Complete</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Great run, {nickname}. Your results are locked in and you will return to the player home screen automatically.
          </p>
        </motion.div>

        {/* Feedback form */}
        {requireFeedback && !feedbackSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-card p-6 sm:p-8 space-y-5 border border-border shadow-[0px_2px_8px_rgba(0,0,0,0.06)]"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Rate this Session</h3>
              <p className="text-sm text-muted-foreground">
                How would you rate the presentation? Your feedback helps the host improve.
              </p>
            </div>

            {/* Star rating */}
            <div className="flex items-center justify-center gap-1" aria-label="Rating">
              {Array.from({ length: feedbackScale }, (_, i) => {
                const starValue = i + 1;
                const isFilled = starValue <= feedbackRating;
                return (
                  <button
                    key={i}
                    onClick={() => setFeedbackRating(starValue)}
                    className={`p-1 transition-all ${
                      isFilled
                        ? "text-yellow-400 scale-110"
                        : "text-muted-foreground/30 hover:text-yellow-300"
                    }`}
                    aria-label={`Rate ${starValue} of ${feedbackScale} star${starValue !== 1 ? "s" : ""}${isFilled ? ", selected" : ""}`}
                  >
                    <Star
                      className={`w-8 h-8 sm:w-10 sm:h-10 ${isFilled ? "fill-yellow-400" : ""}`}
                    />
                  </button>
                );
              })}
            </div>
            {feedbackRating > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                {feedbackRating} / {feedbackScale}
              </p>
            )}

            {/* Comment field */}
            {allowComment && (
              <div>
                <label htmlFor="feedback-comment" className="text-sm font-medium text-muted-foreground block mb-1">
                  Additional comments (optional)
                </label>
                <textarea
                  id="feedback-comment"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share your thoughts…"
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  aria-label="Feedback comment"
                />
              </div>
            )}

            <Button
              size="lg"
              disabled={feedbackRating === 0 || feedbackSubmitting}
              onClick={async () => {
                setFeedbackSubmitting(true);
                try {
                  await submitFeedback(feedbackRating, feedbackComment || undefined);
                  setFeedbackSubmitted(true);
                  setCountdown(10);
                } catch {
                  // Allow retry
                } finally {
                  setFeedbackSubmitting(false);
                }
              }}
              className="w-full gradient-primary border-0 btn-3d text-black font-semibold"
            >
              {feedbackSubmitting ? "Submitting…" : "Submit Feedback"}
            </Button>

            <button
              onClick={() => setFeedbackSubmitted(true)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Skip feedback
            </button>
          </motion.div>
        )}

        {/* Player result card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card p-6 sm:p-8 space-y-5 border border-border shadow-[0px_2px_8px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl">{avatar}</span>
            <div className="text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Player Summary</p>
              <p className="font-bold text-xl text-foreground">{nickname}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="rounded-2xl border border-border bg-muted px-4 py-4">
                <p className="text-xs text-muted-foreground">Final Score</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {totalScore.toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              <div className="rounded-2xl border border-border bg-muted px-4 py-4">
                <p className="text-xs text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold mt-1 text-foreground">
                  {rank ? `#${rank}` : "—"}
                </p>
              </div>
            </div>
            <div>
              <div className="rounded-2xl border border-border bg-muted px-4 py-4">
                <p className="text-xs text-muted-foreground">Players</p>
                <p className="text-2xl font-bold mt-1 text-foreground">
                  {playerCount}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Finish highlight</span>
              </div>
              <p className="text-sm text-foreground/80 dark:text-white/75">
                {isWinner
                  ? "You finished at the top of the leaderboard. Outstanding performance."
                  : isTop3
                  ? "You landed on the podium. Strong finish."
                  : "Your results are saved. Jump back in for another round."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-center gap-2 text-foreground/75 dark:text-white/75 mb-2">
                <TimerReset className="w-4 h-4" />
                <span className="text-sm font-semibold">Auto return</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Returning to the player home screen in <span className="font-semibold text-foreground dark:text-white">{countdown}s</span>.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Final standings */}
        {top5.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 rounded-2xl bg-card p-5 border border-border shadow-[0px_2px_8px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <h3 className="text-sm uppercase tracking-[0.2em] font-medium">
                Final Standings
              </h3>
            </div>
            {top5.map((entry, i) => {
              const isMe = entry.player_id === playerId;
              return (
                <div
                  key={entry.player_id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    isMe
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted border border-border"
                  }`}
                >
                  <span className="text-lg w-8 text-center">
                    {i < 3 ? MEDALS[i] : `#${i + 1}`}
                  </span>
                  <span>{entry.avatar}</span>
                  <span
                    className={`flex-1 text-sm truncate ${isMe ? "font-bold text-primary" : ""}`}
                  >
                    {entry.nickname}
                    {isMe && " (you)"}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            size="lg"
            onClick={handleReturnHome}
            className="w-full gradient-primary border-0 btn-3d text-black font-semibold"
          >
            <House className="w-4 h-4 mr-2" />
            Return to Player Home
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handlePlayAgain}
            className="w-full border-primary/30 bg-primary/10 text-foreground hover:bg-primary/20"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
}
