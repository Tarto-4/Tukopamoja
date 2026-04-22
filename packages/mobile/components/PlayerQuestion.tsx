// ─────────────────────────────────────────────────────────────
// QuizArena Mobile — Player Question Screen
// Large touch-friendly answer buttons, timer, feedback.
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useBrandingStore, buildTheme } from "../stores/useBrandingStore";
import { OPTION_COLORS } from "@quizarena/shared";

const { width: SCREEN_W } = Dimensions.get("window");
const OPTION_SHAPES = ["▲", "◆", "●", "■"];

export default function PlayerQuestion() {
  const {
    currentQuestion,
    questionIndex,
    timeLeft,
    hasAnswered,
    lastResult,
    submitAnswer,
    status,
  } = usePlayerStore();
  const { branding } = useBrandingStore();
  const theme = buildTheme(branding);

  const startTimeRef = useRef(Date.now());

  // Reset start time when question changes
  useState(() => {
    startTimeRef.current = Date.now();
  });

  if (!currentQuestion) return null;

  async function handleAnswer(optionIndex: number) {
    if (hasAnswered) return;
    const timeTaken = Date.now() - startTimeRef.current;
    await submitAnswer(optionIndex, timeTaken);
  }

  // ─── After answering: show feedback ──────────────────────
  if (hasAnswered && lastResult) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackEmoji}>
            {lastResult.isCorrect ? "✅" : "❌"}
          </Text>
          <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>
            {lastResult.isCorrect ? "Correct!" : "Wrong!"}
          </Text>
          {lastResult.isCorrect && (
            <>
              <Text
                style={[
                  styles.feedbackPoints,
                  { color: theme.colors.success },
                ]}
              >
                +{lastResult.points}
              </Text>
              {lastResult.streak > 1 && (
                <Text style={styles.feedbackStreak}>
                  🔥 {lastResult.streak} streak!
                </Text>
              )}
            </>
          )}
          <Text style={[styles.totalScore, { color: theme.colors.textMuted }]}>
            Total: {lastResult.totalScore.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  }

  // ─── Waiting for evaluation (answered but no result yet) ─
  if (hasAnswered) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackEmoji}>🤞</Text>
          <Text style={[styles.feedbackTitle, { color: theme.colors.textMuted }]}>
            Answer locked in...
          </Text>
        </View>
      </View>
    );
  }

  // ─── Answer buttons ──────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Timer */}
      <View style={styles.timerRow}>
        <Text
          style={[
            styles.timer,
            {
              color:
                timeLeft <= 5 ? theme.colors.error : theme.colors.text,
            },
          ]}
        >
          {timeLeft}
        </Text>
        <Text style={[styles.questionNum, { color: theme.colors.textMuted }]}>
          Q{questionIndex + 1}
        </Text>
      </View>

      {/* Option buttons — 2×2 grid filling most of the screen */}
      <View style={styles.optionsGrid}>
        {currentQuestion.options.map((opt, i) => (
          <Pressable
            key={i}
            onPress={() => handleAnswer(i)}
            style={({ pressed }) => [
              styles.optionButton,
              {
                backgroundColor: OPTION_COLORS[i]?.bg || "#666",
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={styles.optionShape}>{OPTION_SHAPES[i]}</Text>
            <Text style={styles.optionText} numberOfLines={3}>
              {opt.text}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  timer: {
    fontSize: 48,
    fontWeight: "900",
  },
  questionNum: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionsGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    width: (SCREEN_W - 32) / 2, // 12px padding * 2 + 8px gap
    flex: 1,
    minHeight: 120,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    flexBasis: "48%",
  },
  optionShape: {
    fontSize: 24,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  feedbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  feedbackEmoji: {
    fontSize: 72,
  },
  feedbackTitle: {
    fontSize: 32,
    fontWeight: "900",
  },
  feedbackPoints: {
    fontSize: 48,
    fontWeight: "900",
  },
  feedbackStreak: {
    fontSize: 18,
    color: "#FF9500",
    fontWeight: "600",
  },
  totalScore: {
    fontSize: 16,
    marginTop: 12,
  },
});
