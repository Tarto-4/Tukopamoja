import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Tukopamoja brand palette
        ens: {
          crimson: "#f42535",
          "crimson-light": "#f7a800",
          "crimson-dark": "#65513c",
          carbon: "#050405",
          "carbon-2": "#4c4d4e",
          slate: "#42738d",
          "slate-light": "#5c6670",
          gold: "#eecd00",
          "gold-dim": "#d8d2c4",
          electric: "#873287",
        },
        // Explicit palette tokens
        palette: {
          yellow: "#eecd00",
          "dark-grey": "#4c4d4e",
          black: "#050405",
          purple: "#873287",
          green: "#82bc00",
          blue: "#42738d",
          orange: "#f7a800",
          red: "#f42535",
          brown: "#65513c",
          "light-grey": "#5c6670",
          beige: "#d8d2c4",
        },
        // Quiz answer colours — vibrant, WCAG AA on white text
        "quiz-red":    "#E8003E",
        "quiz-blue":   "#0A62FF",
        "quiz-yellow": "#FF9F00",
        "quiz-green":  "#00A854",
        // Answer hover/glow tints
        "quiz-red-glow":    "rgba(232,0,62,0.35)",
        "quiz-blue-glow":   "rgba(10,98,255,0.35)",
        "quiz-yellow-glow": "rgba(255,159,0,0.35)",
        "quiz-green-glow":  "rgba(0,168,84,0.35)",
        // Semantic game tokens
        "game-correct":  "#00C96E",
        "game-wrong":    "#FF2453",
        "game-neutral":  "#8B8FA8",
        "game-streak":   "#FF9F00",
        "game-rank-1":   "#FFD700",
        "game-rank-2":   "#C0C0C0",
        "game-rank-3":   "#CD7F32",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "serif"],
      },
      boxShadow: {
        "ens-sm":   "0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)",
        "ens-md":   "0 4px 6px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)",
        "ens-lg":   "0 10px 25px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.4)",
        "ens-xl":   "0 20px 50px rgba(0,0,0,0.7), 0 8px 20px rgba(0,0,0,0.5)",
        "ens-glow":      "0 0 20px rgba(135,50,135,0.3), 0 0 40px rgba(135,50,135,0.1)",
        "ens-gold-glow": "0 0 24px rgba(238,205,0,0.45), 0 0 48px rgba(238,205,0,0.18)",
        // Answer button glows
        "quiz-red-glow":    "0 0 18px rgba(232,0,62,0.55),  0 4px 0 rgba(140,0,28,1)",
        "quiz-blue-glow":   "0 0 18px rgba(10,98,255,0.55), 0 4px 0 rgba(0,50,160,1)",
        "quiz-yellow-glow": "0 0 18px rgba(255,159,0,0.55), 0 4px 0 rgba(180,100,0,1)",
        "quiz-green-glow":  "0 0 18px rgba(0,168,84,0.55),  0 4px 0 rgba(0,100,45,1)",
        // Game feedback
        "correct-glow": "0 0 32px rgba(0,201,110,0.6), 0 0 64px rgba(0,201,110,0.25)",
        "wrong-glow":   "0 0 32px rgba(255,36,83,0.6),  0 0 64px rgba(255,36,83,0.25)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(238,205,0,0.35)" },
          "50%":       { boxShadow: "0 0 42px rgba(238,205,0,0.75)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "bounce-in": {
          "0%":   { transform: "scale(0.55)", opacity: "0" },
          "65%":  { transform: "scale(1.08)", opacity: "1" },
          "80%":  { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)" },
        },
        "score-pop": {
          "0%":   { transform: "translateY(0) scale(1)",    opacity: "1" },
          "50%":  { transform: "translateY(-28px) scale(1.3)", opacity: "1" },
          "100%": { transform: "translateY(-52px) scale(1)",   opacity: "0" },
        },
        "correct-flash": {
          "0%,100%": { boxShadow: "0 0 0 0 transparent" },
          "30%":     { boxShadow: "0 0 0 6px rgba(0,201,110,0.55)" },
        },
        "wrong-shake": {
          "0%,100%": { transform: "translateX(0)" },
          "20%":     { transform: "translateX(-8px)" },
          "40%":     { transform: "translateX(8px)" },
          "60%":     { transform: "translateX(-5px)" },
          "80%":     { transform: "translateX(5px)" },
        },
        "timer-critical": {
          "0%,100%": { color: "#f42535", transform: "scale(1)" },
          "50%":     { color: "#ff6b87", transform: "scale(1.12)" },
        },
        "rank-slide": {
          "0%":   { transform: "translateX(-32px)", opacity: "0" },
          "100%": { transform: "translateX(0)",     opacity: "1" },
        },
        "glow-pulse": {
          "0%,100%": { opacity: "0.6" },
          "50%":     { opacity: "1" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "pulse-glow":      "pulse-glow 2s ease-in-out infinite",
        shimmer:           "shimmer 2s linear infinite",
        "bounce-in":       "bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "score-pop":       "score-pop 0.9s ease-out both",
        "correct-flash":   "correct-flash 0.6s ease both",
        "wrong-shake":     "wrong-shake 0.45s ease both",
        "timer-critical":  "timer-critical 0.6s ease-in-out infinite",
        "rank-slide":      "rank-slide 0.4s ease both",
        "glow-pulse":      "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
