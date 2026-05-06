"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "tukopamoja_theme";

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove("dark", "light");
  html.classList.add(theme);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const initial: Theme = stored === "light" || stored === "dark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";

    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
