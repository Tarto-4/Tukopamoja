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
import { useBrandingStore, buildTheme, withAlpha } from "../stores/useBrandingStore";

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
      <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.card]}>
        <View style={[styles.topAccent, { backgroundColor: theme.colors.primary }]} />

        {branding?.logo_url && (
          <Image
            source={{ uri: branding.logo_url }}
            style={styles.logo}
            resizeMode="contain"
          />
        )}

        <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>PLAYER READY</Text>
        <Text style={[styles.title, { color: theme.colors.primary }]}>You&apos;re In!</Text>

        <Animated.View
          style={[
            styles.avatarContainer,
            {
              backgroundColor: withAlpha(theme.colors.primary, 0.12),
              borderColor: withAlpha(theme.colors.primary, 0.3),
            },
            theme.shadows.glow,
            animStyle,
          ]}
        >
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
              backgroundColor: withAlpha(theme.colors.primary, 0.15),
              borderColor: withAlpha(theme.colors.primary, 0.3),
            },
          ]}
        >
          <Text style={[styles.brandText, { color: theme.colors.primary }]}> 
            {branding?.name || "QuizArena"}
          </Text>
        </View>
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
  },
  panel: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 48,
  },
  nickname: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
  },
  waiting: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  brandBar: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  brandText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
