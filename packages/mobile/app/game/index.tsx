// ─────────────────────────────────────────────────────────────
// QuizArena Mobile — Game Screen
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
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
