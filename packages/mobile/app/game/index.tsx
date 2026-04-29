// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA Mobile — Game Screen
// Renders different views based on session status.
// ─────────────────────────────────────────────────────────────

import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlayerStore } from "../../stores/usePlayerStore";
import { useBrandingStore, buildTheme } from "../../stores/useBrandingStore";
import { usePlayerRealtime } from "../../hooks/usePlayerRealtime";
import PlayerLobby from "../../components/PlayerLobby";
import PlayerQuestion from "../../components/PlayerQuestion";
import PlayerLeaderboard from "../../components/PlayerLeaderboard";
import PlayerGameOver from "../../components/PlayerGameOver";

export default function GameScreen() {
  const { status, session, nickname } = usePlayerStore();
  const { branding } = useBrandingStore();
  const theme = buildTheme(branding);

  // Connect to realtime
  usePlayerRealtime();

  if (!session) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={[styles.glowTop, { backgroundColor: theme.colors.warningSoft }]} />
        <Text style={{ color: theme.colors.textMuted, textAlign: "center" }}>
          No active session
        </Text>
      </SafeAreaView>
    );
  }

  function renderScreen() {
    switch (status) {
      case "lobby":
        return <PlayerLobby />;
      case "question_active":
        return <PlayerQuestion />;
      case "evaluating":
        return <PlayerQuestion />;
      case "leaderboard":
        return <PlayerLeaderboard />;
      case "finished":
        return <PlayerGameOver />;
      default:
        return null;
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.accentBar, { backgroundColor: theme.colors.primary }]} />
      <View style={[styles.glowTop, { backgroundColor: theme.colors.warningSoft }]} />
      <View style={[styles.glowBottom, { backgroundColor: theme.colors.infoSoft }]} />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 2,
  },
  glowTop: {
    position: "absolute",
    top: 40,
    left: "50%",
    marginLeft: -140,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.4,
  },
  glowBottom: {
    position: "absolute",
    bottom: 20,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.18,
  },
});
