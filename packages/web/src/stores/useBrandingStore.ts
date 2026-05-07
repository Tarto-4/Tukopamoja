// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Branding Store (Zustand)
// Fetches and caches company branding from Supabase.
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@tukopamoja/shared";

interface BrandingState {
  branding: Organization | null;
  loading: boolean;
  fetchBranding: (force?: boolean) => Promise<void>;
}

export const useBrandingStore = create<BrandingState>((set, get) => ({
  branding: null,
  loading: false,

  fetchBranding: async (force = false) => {
    if (get().loading) return; // Prevent duplicate concurrent fetches
    if (!force && get().branding) return; // Already loaded — use force to re-fetch
    set({ loading: true });
    const supabase = createClient();

    const { data, error } = await supabase
      .from("organization")
      .select("*")
      .single();

    if (error) {
      console.warn("[TUKOPAMOJA] Failed to fetch branding:", error.message);
      set({ loading: false });
      return;
    }

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
