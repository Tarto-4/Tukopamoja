// ─────────────────────────────────────────────────────────────
// QuizArena Mobile — Player Lobby (waiting for host to start)
// ─────────────────────────────────────────────────────────────

import { View, Text, StyleSheet, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useBrandingStore, buildTheme } from "../stores/useBrandingStore";

export default function PlayerLobby() {
  const { nickname } = usePlayerStore();
  const { branding } = useBrandingStore();
  const theme = buildTheme(branding);

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.15, { duration: 1200 }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Logo */}
      {branding?.logo_url && (
        <Image
          source={{ uri: branding.logo_url }}
          style={styles.logo}
          resizeMode="contain"
        />
      )}

      <Text style={[styles.title, { color: theme.colors.primary }]}>
        You're In!
      </Text>

      <Animated.View style={[styles.avatarContainer, animStyle]}>
        <Text style={styles.avatarText}>🎮</Text>
      </Animated.View>

      <Text style={[styles.nickname, { color: theme.colors.text }]}>
        {nickname}
      </Text>

      <Text style={[styles.waiting, { color: theme.colors.textMuted }]}>
        Waiting for the host to start the game...
      </Text>

      <View
        style={[
          styles.brandBar,
          {
            backgroundColor: theme.colors.primary + "20",
            borderColor: theme.colors.primary + "40",
          },
        ]}
      >
        <Text style={[styles.brandText, { color: theme.colors.primary }]}>
          {branding?.name || "QuizArena"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#161B22",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 48,
  },
  nickname: {
    fontSize: 24,
    fontWeight: "700",
  },
  waiting: {
    fontSize: 14,
    textAlign: "center",
  },
  brandBar: {
    position: "absolute",
    bottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  brandText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
