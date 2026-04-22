// ─────────────────────────────────────────────────────────────
// QuizArena Mobile — Deep Linking Configuration
// Handles QR code deep links: quizarena://join?pin=123456
// and universal links: https://quizarena.example.com/join?pin=123456
// ─────────────────────────────────────────────────────────────

import * as Linking from "expo-linking";

/**
 * Parse a deep link URL and extract the game PIN.
 * Supports:
 *  - quizarena://join?pin=123456
 *  - https://quizarena.example.com/join?pin=123456
 *  - https://host.example.com/join?pin=123456 (web fallback)
 */
export function extractPinFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url);

    // Direct pin parameter
    if (parsed.queryParams?.pin) {
      return String(parsed.queryParams.pin);
    }

    // Path-based: /join/123456
    if (parsed.path?.startsWith("join/")) {
      const pin = parsed.path.replace("join/", "");
      if (/^\d{6}$/.test(pin)) return pin;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generate the deep link URL for a game session.
 * Used by the host to generate QR codes.
 */
export function buildJoinUrl(pin: string, webHost: string): string {
  // Universal link that falls back to web if app not installed
  return `${webHost}/join?pin=${pin}`;
}

/**
 * Build the native app deep link (for QR code target).
 */
export function buildAppDeepLink(pin: string): string {
  return `quizarena://join?pin=${pin}`;
}
