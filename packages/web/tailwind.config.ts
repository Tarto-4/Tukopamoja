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
        // ENS-Future brand colors
        ens: {
          crimson: "#8E191E",
          "crimson-light": "#B22229",
          "crimson-dark": "#6B1216",
          carbon: "#111111",
          slate: "#3A3A3C",
          "slate-light": "#636366",
          gold: "#C9A84C",
        },
        // Game answer colors (muted for ENS aesthetic)
        "quiz-red": "#C62828",
        "quiz-blue": "#1565C0",
        "quiz-yellow": "#F9A825",
        "quiz-green": "#2E7D32",
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
        "ens-sm": "0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)",
        "ens-md": "0 4px 6px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)",
        "ens-lg": "0 10px 25px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.4)",
        "ens-xl": "0 20px 50px rgba(0,0,0,0.7), 0 8px 20px rgba(0,0,0,0.5)",
        "ens-glow": "0 0 20px rgba(142,25,30,0.3), 0 0 40px rgba(142,25,30,0.1)",
        "ens-gold-glow": "0 0 20px rgba(201,168,76,0.3), 0 0 40px rgba(201,168,76,0.1)",
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
          "0%, 100%": { boxShadow: "0 0 20px rgba(142,25,30,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(142,25,30,0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
