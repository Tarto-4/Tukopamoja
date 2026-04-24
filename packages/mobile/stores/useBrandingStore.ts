// ─────────────────────────────────────────────────────────────
// QuizArena Mobile — Branding Store (Zustand)
// Fetches company branding on session join, applies theme.
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Organization } from "@quizarena/shared";

interface BrandingState {
  branding: Organization | null;
  loading: boolean;

  /** Fetch branding from Supabase — called when player joins a session */
  fetchBranding: () => Promise<Organization | null>;
}

export const useBrandingStore = create<BrandingState>((set) => ({
  branding: null,
  loading: false,

  fetchBranding: async () => {
    set({ loading: true });

    const { data, error } = await supabase
      .from("organization")
      .select("*")
      .single();

    if (error || !data) {
      set({ loading: false });
      return null;
    }

    const org = data as Organization;
    set({ branding: org, loading: false });
    return org;
  },
}));

export function withAlpha(hex: string, alpha: number) {
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return hex;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

export function buildTheme(branding: Organization | null) {
  const primary = branding?.primary_color || "#EEDC00";
  const secondary = branding?.secondary_color || "#f5e500";
  const fontFamily = branding?.font_family || "System";

  return {
    colors: {
      primary,
      secondary,
      primaryDark: "#d4c500",
      background: "#0A0A0A",
      surface: "rgba(0, 0, 0, 0.7)",
      surfaceSoft: "rgba(255, 255, 255, 0.05)",
      surfaceStrong: "rgba(255, 255, 255, 0.08)",
      text: "#FFFFFF",
      textSecondary: "rgba(255, 255, 255, 0.9)",
      textMuted: "rgba(255, 255, 255, 0.65)",
      textSubtle: "rgba(255, 255, 255, 0.45)",
      border: "rgba(255, 255, 255, 0.15)",
      borderSoft: "rgba(255, 255, 255, 0.1)",
      overlay: "rgba(0, 0, 0, 0.55)",
      success: "#00bb7f",
      successSoft: "rgba(0, 187, 127, 0.2)",
      error: "#ff2357",
      errorSoft: "rgba(255, 35, 87, 0.2)",
      warning: "#f99c00",
      warningSoft: "rgba(249, 156, 0, 0.2)",
      info: "#3080ff",
      infoSoft: "rgba(48, 128, 255, 0.2)",
      optionRed: "#ff2357",
      optionBlue: "#3080ff",
      optionYellow: "#EEDC00",
      optionGreen: "#00bb7f",
    },
    fonts: {
      display: fontFamily,
      body: fontFamily,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    radius: {
      sm: 12,
      md: 16,
      lg: 24,
    },
    shadows: {
      card: {
        shadowColor: "#000000",
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
      },
      glow: {
        shadowColor: primary,
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      },
    },
  };
}
