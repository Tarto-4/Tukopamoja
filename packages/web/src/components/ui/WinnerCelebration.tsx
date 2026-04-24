"use client";

import { motion } from "framer-motion";

type WinnerCelebrationProps = {
  active: boolean;
  winnerLabel?: string;
};

const CONFETTI_PARTICLES = [
  "left-[4%] w-[5px] h-[10px] bg-quiz-red",
  "left-[10%] w-[7px] h-[12px] bg-ens-gold",
  "left-[16%] w-[6px] h-[14px] bg-ens-crimson-light",
  "left-[22%] w-[8px] h-[11px] bg-foreground",
  "left-[28%] w-[6px] h-[13px] bg-ens-slate-light",
  "left-[34%] w-[5px] h-[12px] bg-quiz-green",
  "left-[40%] w-[8px] h-[10px] bg-quiz-blue",
  "left-[46%] w-[6px] h-[15px] bg-ens-gold",
  "left-[52%] w-[7px] h-[10px] bg-quiz-red",
  "left-[58%] w-[5px] h-[13px] bg-ens-crimson-light",
  "left-[64%] w-[8px] h-[11px] bg-foreground",
  "left-[70%] w-[6px] h-[12px] bg-ens-slate-light",
  "left-[76%] w-[7px] h-[10px] bg-quiz-yellow",
  "left-[82%] w-[5px] h-[14px] bg-quiz-green",
  "left-[88%] w-[8px] h-[12px] bg-ens-gold",
  "left-[94%] w-[6px] h-[11px] bg-quiz-blue",
] as const;

const FIREWORK_POSITIONS = [
  "left-[16%] top-[22%]",
  "left-[82%] top-[20%]",
  "left-[24%] top-[52%]",
  "left-[74%] top-[48%]",
] as const;

export default function WinnerCelebration({
  active,
  winnerLabel = "Winner",
}: WinnerCelebrationProps) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 42 }).map((_, i) => {
        const duration = 2.8 + (i % 5) * 0.45;
        const delay = (i % 7) * 0.15;
        const drift = (i % 2 === 0 ? 1 : -1) * (8 + (i % 9));

        return (
          <motion.span
            key={`confetti-${i}`}
            className={`absolute top-[-10%] rounded-sm opacity-90 ${CONFETTI_PARTICLES[i % CONFETTI_PARTICLES.length]}`}
            initial={{ y: -40, rotate: 0, x: 0 }}
            animate={{ y: [0, 700], rotate: [0, 360], x: [0, drift, 0] }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
          />
        );
      })}

      {FIREWORK_POSITIONS.map((position, i) => (
        <motion.div
          key={`firework-${i}`}
          className={`absolute ${position}`}
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: [0.1, 1.2, 0.4], opacity: [0, 0.95, 0] }}
          transition={{
            duration: 1.8,
            delay: i * 0.4,
            repeat: Infinity,
            repeatDelay: 1.4,
            ease: "easeOut",
          }}
        >
          <div className="relative w-24 h-24">
            <span className="absolute inset-0 rounded-full border-2 border-ens-gold/70" />
            <span className="absolute inset-3 rounded-full border border-ens-crimson-light/70" />
            <span className="absolute left-1/2 top-0 -translate-x-1/2 w-2 h-2 rounded-full bg-ens-gold" />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-ens-crimson-light" />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-ens-gold" />
            <span className="absolute left-1/2 bottom-0 -translate-x-1/2 w-2 h-2 rounded-full bg-ens-crimson-light" />
          </div>
        </motion.div>
      ))}

      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/45 border border-ens-gold/40 text-sm font-semibold text-ens-gold"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: [0, -4, 0], opacity: 1 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        🏆 {winnerLabel}
      </motion.div>
    </div>
  );
}
