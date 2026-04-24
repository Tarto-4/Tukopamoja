"use client";

import { motion } from "framer-motion";

type WinnerCelebrationProps = {
  active: boolean;
  winnerLabel?: string;
};

const CONFETTI_COLORS = ["#8E191E", "#C9A84C", "#B22229", "#F5F5F3", "#636366"];

export default function WinnerCelebration({
  active,
  winnerLabel = "Winner",
}: WinnerCelebrationProps) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 42 }).map((_, i) => {
        const left = (i * 23) % 100;
        const duration = 2.8 + (i % 5) * 0.45;
        const delay = (i % 7) * 0.15;
        const drift = (i % 2 === 0 ? 1 : -1) * (8 + (i % 9));

        return (
          <motion.span
            key={`confetti-${i}`}
            className="absolute top-[-10%] rounded-sm"
            style={{
              left: `${left}%`,
              width: `${5 + (i % 4)}px`,
              height: `${10 + (i % 6)}px`,
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              opacity: 0.9,
            }}
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

      {[
        { x: "16%", y: "22%", delay: 0 },
        { x: "82%", y: "20%", delay: 0.5 },
        { x: "24%", y: "52%", delay: 0.9 },
        { x: "74%", y: "48%", delay: 1.2 },
      ].map((burst, i) => (
        <motion.div
          key={`firework-${i}`}
          className="absolute"
          style={{ left: burst.x, top: burst.y }}
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: [0.1, 1.2, 0.4], opacity: [0, 0.95, 0] }}
          transition={{
            duration: 1.8,
            delay: burst.delay,
            repeat: Infinity,
            repeatDelay: 1.4,
            ease: "easeOut",
          }}
        >
          <div className="relative w-24 h-24">
            {Array.from({ length: 10 }).map((_, ray) => (
              <span
                key={ray}
                className="absolute left-1/2 top-1/2 h-10 w-[2px] origin-bottom"
                style={{
                  transform: `translate(-50%, -100%) rotate(${ray * 36}deg)`,
                  background:
                    ray % 2 === 0
                      ? "linear-gradient(to top, rgba(201,168,76,0), rgba(201,168,76,0.95))"
                      : "linear-gradient(to top, rgba(178,34,41,0), rgba(178,34,41,0.95))",
                }}
              />
            ))}
            <span className="absolute inset-0 rounded-full border border-ens-gold/60" />
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
