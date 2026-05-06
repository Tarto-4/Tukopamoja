// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Dancing Characters
// Animated cartoon characters that dance beneath the
// leaderboard / game-over screens for visual delight.
// Uses pure CSS keyframe animations — no runtime JS.
// Respects prefers-reduced-motion automatically.
// ─────────────────────────────────────────────────────────────

"use client";

import { useMemo } from "react";

/* ── Character Catalog ────────────────────────────────────── */

interface DancerDef {
  emoji: string;
  label: string;
}

const DANCERS: DancerDef[] = [
  { emoji: "🕺", label: "Disco dancer" },
  { emoji: "💃", label: "Salsa dancer" },
  { emoji: "🧜‍♀️", label: "Hula dancer" },
  { emoji: "🤸", label: "Acrobat" },
  { emoji: "🎸", label: "Guitarist" },
  { emoji: "🎷", label: "Saxophonist" },
  { emoji: "🥁", label: "Drummer" },
  { emoji: "🎤", label: "Singer" },
  { emoji: "🎺", label: "Trumpeter" },
  { emoji: "🪇", label: "Maracas player" },
];

/* ── Dance Styles ─────────────────────────────────────────── */

type DanceStyle = "hula" | "salsa" | "disco" | "bounce" | "wiggle";

const DANCE_CLASSES: Record<DanceStyle, string> = {
  hula:    "dance-hula",
  salsa:   "dance-salsa",
  disco:   "dance-disco",
  bounce:  "dance-bounce",
  wiggle:  "dance-wiggle",
};

const ALL_STYLES = Object.keys(DANCE_CLASSES) as DanceStyle[];

/* ── Helpers ──────────────────────────────────────────────── */

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

/* ── Props ────────────────────────────────────────────────── */

interface DancingCharactersProps {
  /** Number of characters to show (default 5, max 8) */
  count?: number;
  /** Optional seed for deterministic randomisation */
  seed?: number;
  /** Additional CSS classes for the wrapper */
  className?: string;
}

/* ── Component ────────────────────────────────────────────── */

export default function DancingCharacters({
  count = 5,
  seed = 42,
  className = "",
}: DancingCharactersProps) {
  const characters = useMemo(() => {
    const n = Math.min(count, 8);
    const result: { dancer: DancerDef; style: DanceStyle; delay: number }[] = [];
    const used = new Set<number>();

    for (let i = 0; i < n; i++) {
      let idx: number;
      let attempt = 0;
      do {
        idx = Math.floor(seededRandom(seed + i + attempt * 97) * DANCERS.length);
        attempt++;
      } while (used.has(idx) && attempt < 20);
      used.add(idx);

      result.push({
        dancer: DANCERS[idx],
        style: pickRandom(ALL_STYLES, seed + i * 31),
        delay: parseFloat((seededRandom(seed + i * 17) * 1.2).toFixed(2)),
      });
    }
    return result;
  }, [count, seed]);

  return (
    <div
      className={`flex items-end justify-center gap-3 sm:gap-5 py-4 ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      {characters.map((c, i) => (
        <div
          key={i}
          className={`dancer-figure ${DANCE_CLASSES[c.style]}`}
          style={{ animationDelay: `${c.delay}s` }}
          title={c.dancer.label}
        >
          <span className="text-3xl sm:text-4xl md:text-5xl select-none">
            {c.dancer.emoji}
          </span>
        </div>
      ))}
    </div>
  );
}
