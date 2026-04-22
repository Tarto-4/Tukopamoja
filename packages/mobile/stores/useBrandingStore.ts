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

// ─── Helper: Build dynamic theme from branding ──────────────
export function buildTheme(branding: Organization | null) {
  const primary = branding?.primary_color || "#6C5CE7";
  const secondary = branding?.secondary_color || "#00CEC9";
  const fontFamily = branding?.font_family || "System";

  return {
    colors: {
      primary,
      secondary,
      background: "#0D1117",
      surface: "#161B22",
      text: "#F0F6FC",
      textMuted: "#8B949E",
      error: "#E21B3C",
      success: "#26890C",
      warning: "#D89E00",

      // Option colors (Kahoot-style)
      optionRed: "#E21B3C",
      optionBlue: "#1368CE",
      optionYellow: "#D89E00",
      optionGreen: "#26890C",
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
  };
}
