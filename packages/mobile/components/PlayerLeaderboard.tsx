// ─────────────────────────────────────────────────────────────
// QuizArena Mobile — Player Leaderboard
// ─────────────────────────────────────────────────────────────

import { View, Text, FlatList, StyleSheet } from "react-native";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useBrandingStore, buildTheme } from "../stores/useBrandingStore";
import { MEDALS } from "@quizarena/shared";

export default function PlayerLeaderboard() {
  const { leaderboard, myRank, myScore, playerId } = usePlayerStore();
  const { branding } = useBrandingStore();
  const theme = buildTheme(branding);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* My rank */}
      <View style={styles.myRankSection}>
        <Text style={[styles.rankLabel, { color: theme.colors.textMuted }]}>
          YOUR POSITION
        </Text>
        <Text style={[styles.rankNumber, { color: theme.colors.primary }]}>
          #{myRank}
        </Text>
        <Text style={[styles.scoreText, { color: theme.colors.text }]}>
          {myScore.toLocaleString()} points
        </Text>
      </View>

      {/* Top players */}
      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
        TOP PLAYERS
      </Text>

      <FlatList
        data={leaderboard.slice(0, 10)}
        keyExtractor={(item) => item.player_id}
        renderItem={({ item, index }) => {
          const isMe = item.player_id === playerId;
          return (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: isMe
                    ? theme.colors.primary + "20"
                    : theme.colors.surface,
                  borderColor: isMe ? theme.colors.primary : "transparent",
                },
              ]}
            >
              <View style={styles.rankCol}>
                {item.rank <= 3 ? (
                  <Text style={styles.medal}>{MEDALS[item.rank - 1]}</Text>
                ) : (
                  <Text
                    style={[
                      styles.rankText,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    #{item.rank}
                  </Text>
                )}
              </View>
              <View style={styles.nameCol}>
                <Text
                  style={[
                    styles.nickname,
                    {
                      color: isMe
                        ? theme.colors.primary
                        : theme.colors.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.avatar} {item.nickname}
                  {isMe ? " (You)" : ""}
                </Text>
              </View>
              <Text style={[styles.score, { color: theme.colors.text }]}>
                {item.score.toLocaleString()}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
      />

      {/* Waiting */}
      <Text style={[styles.waitingText, { color: theme.colors.textMuted }]}>
        Waiting for next question...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  myRankSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 16,
  },
  rankLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
  },
  rankNumber: {
    fontSize: 64,
    fontWeight: "900",
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: "center",
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  rankCol: {
    width: 40,
    alignItems: "center",
  },
  medal: {
    fontSize: 24,
  },
  rankText: {
    fontSize: 16,
    fontWeight: "700",
  },
  nameCol: {
    flex: 1,
    marginHorizontal: 8,
  },
  nickname: {
    fontSize: 16,
    fontWeight: "700",
  },
  score: {
    fontSize: 18,
    fontWeight: "900",
  },
  waitingText: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 16,
    marginBottom: 8,
  },
});
