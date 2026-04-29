// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA Mobile — Home / Join Screen
// Players enter a PIN or scan QR to join a game.
// Dynamically applies company branding.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBrandingStore, buildTheme } from "../stores/useBrandingStore";
import { usePlayerStore } from "../stores/usePlayerStore";

export default function JoinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pin?: string }>();
  const { branding } = useBrandingStore();
  const { joinSession } = usePlayerStore();
  const theme = buildTheme(branding);

  const [pin, setPin] = useState(params.pin || "");
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);

  async function handleJoin() {
    if (!pin.trim() || !nickname.trim()) {
      Alert.alert("Missing info", "Enter both a game PIN and your nickname.");
      return;
    }

    setJoining(true);
    const success = await joinSession(pin.trim(), nickname.trim());
    setJoining(false);

    if (success) {
      router.replace("/game");
    } else {
      Alert.alert(
        "Couldn't join",
        "Check the PIN and try again. The game may have already ended."
      );
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* Branding header */}
        <View style={styles.header}>
          {branding?.logo_url ? (
            <Image
              source={{ uri: branding.logo_url }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : null}
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            {branding?.name || "TUKOPAMOJA"}
          </Text>
          {branding?.tagline ? (
            <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>
              {branding.tagline}
            </Text>
          ) : null}
        </View>

        {/* PIN input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>
            Game PIN
          </Text>
          <TextInput
            style={[
              styles.pinInput,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.primary,
              },
            ]}
            value={pin}
            onChangeText={setPin}
            placeholder="000000"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            autoFocus={!params.pin}
          />
        </View>

        {/* Nickname input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>
            Your Nickname
          </Text>
          <TextInput
            style={[
              styles.nicknameInput,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.primary + "40",
              },
            ]}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Enter your name"
            placeholderTextColor={theme.colors.textMuted}
            maxLength={20}
            autoFocus={!!params.pin}
          />
        </View>

        {/* Join button */}
        <Pressable
          style={({ pressed }) => [
            styles.joinButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.8 : joining ? 0.6 : 1,
            },
          ]}
          onPress={handleJoin}
          disabled={joining}
        >
          <Text style={styles.joinButtonText}>
            {joining ? "Joining..." : "Join Game 🎮"}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    marginTop: 4,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pinInput: {
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 12,
    paddingHorizontal: 16,
  },
  nicknameInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 18,
    paddingHorizontal: 16,
  },
  joinButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
});
