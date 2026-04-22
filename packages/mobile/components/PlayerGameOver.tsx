// ─────────────────────────────────────────────────────────────
// QuizArena Mobile — Player Game Over Screen
// ─────────────────────────────────────────────────────────────

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useBrandingStore, buildTheme } from "../stores/useBrandingStore";
import { MEDALS } from "@quizarena/shared";

export default function PlayerGameOver() {
  const router = useRouter();
  const { myRank, myScore, leaderboard, reset } = usePlayerStore();
  const { branding } = useBrandingStore();
  const theme = buildTheme(branding);

  const top3 = leaderboard.slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Text style={styles.emoji}>🎉</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Game Over!
      </Text>

      {/* Your rank */}
      <View style={styles.myResult}>
        <Text style={[styles.rankLabel, { color: theme.colors.textMuted }]}>
          YOUR FINAL RANK
        </Text>
        <Text style={[styles.rankNum, { color: theme.colors.primary }]}>
          #{myRank}
        </Text>
        <Text style={[styles.scoreText, { color: theme.colors.text }]}>
          {myScore.toLocaleString()} points
        </Text>
      </View>

      {/* Top 3 podium */}
      <View style={styles.podium}>
        {top3.map((entry) => (
          <View key={entry.player_id} style={styles.podiumEntry}>
            <Text style={styles.medal}>
              {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
            </Text>
            <Text
              style={[styles.podiumName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {entry.nickname}
            </Text>
            <Text style={[styles.podiumScore, { color: theme.colors.textMuted }]}>
              {entry.score.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Play again */}
      <Pressable
        style={({ pressed }) => [
          styles.playAgain,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.primary + "40",
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => {
          reset();
          router.replace("/");
        }}
      >
        <Text style={[styles.playAgainText, { color: theme.colors.primary }]}>
          🔄 Play Again
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
  },
  myResult: {
    alignItems: "center",
    paddingVertical: 12,
  },
  rankLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
  },
  rankNum: {
    fontSize: 52,
    fontWeight: "900",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "700",
  },
  podium: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  podiumEntry: {
    alignItems: "center",
    flex: 1,
    maxWidth: 100,
  },
  medal: {
    fontSize: 28,
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  podiumScore: {
    fontSize: 11,
    marginTop: 2,
  },
  playAgain: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
