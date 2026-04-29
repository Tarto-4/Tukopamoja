// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Branding Store (Zustand)
// Fetches and caches company branding from Supabase.
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@quizarena/shared";

interface BrandingState {
  branding: Organization | null;
  loading: boolean;
  fetchBranding: () => Promise<void>;
}

export const useBrandingStore = create<BrandingState>((set) => ({
  branding: null,
  loading: false,

  fetchBranding: async () => {
    set({ loading: true });
    const supabase = createClient();

    const { data } = await supabase
      .from("organization")
      .select("*")
      .single();

    if (data) {
      const org = data as Organization;
      set({ branding: org, loading: false });

      // Apply CSS custom properties for brand theming
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty(
          "--brand-primary",
          org.primary_color
        );
        document.documentElement.style.setProperty(
          "--brand-secondary",
          org.secondary_color
        );
        if (org.font_family) {
          document.documentElement.style.setProperty(
            "--font-display",
            `"${org.font_family}", system-ui, sans-serif`
          );
        }
      }
    } else {
      set({ loading: false });
    }
  },
}));
