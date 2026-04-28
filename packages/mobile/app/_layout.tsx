// ─────────────────────────────────────────────────────────────
// Tokupojomo Mobile — Root Layout
// ─────────────────────────────────────────────────────────────

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useBrandingStore } from "../stores/useBrandingStore";

export default function RootLayout() {
  const { fetchBranding } = useBrandingStore();

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0D1117" },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}
