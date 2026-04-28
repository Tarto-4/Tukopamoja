// ─────────────────────────────────────────────────────────────
// Tokupojomo Mobile — Player Leaderboard
// ─────────────────────────────────────────────────────────────

import { View, Text, FlatList, StyleSheet } from "react-native";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useBrandingStore, buildTheme, withAlpha } from "../stores/useBrandingStore";
import { MEDALS } from "@quizarena/shared";

export default function PlayerLeaderboard() {
  const { leaderboard, myRank, myScore, playerId } = usePlayerStore();
  const { branding } = useBrandingStore();
  const theme = buildTheme(branding);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.myRankSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.card]}>
        <View style={[styles.topAccent, { backgroundColor: theme.colors.primary }]} />
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
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}> 
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
                    ? withAlpha(theme.colors.primary, 0.16)
                    : theme.colors.surfaceSoft,
                  borderColor: isMe ? withAlpha(theme.colors.primary, 0.35) : theme.colors.borderSoft,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
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
    fontWeight: "700",
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
    padding: 14,
    borderRadius: 16,
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
