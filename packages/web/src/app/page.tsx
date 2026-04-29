"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { withBasePath } from "@/lib/base-path";
import BrandedBackground from "@/components/ui/BrandedBackground";
import { BrainCircuit, Puzzle, Swords, Sparkles } from "lucide-react";

type GameMode = {
  id: "quiz" | "puzzle" | "chess" | "word";
  name: string;
  description: string;
  icon: typeof BrainCircuit;
  status: "available" | "coming-soon";
};

const GAME_MODES: GameMode[] = [
  {
    id: "quiz",
    name: "TUKOPAMOJA",
    description: "Live multiplayer quiz battles with presenter-led rounds.",
    icon: BrainCircuit,
    status: "available",
  },
  {
    id: "puzzle",
    name: "Puzzle Rush",
    description: "Competitive timed puzzle solving with shared leaderboards.",
    icon: Puzzle,
    status: "coming-soon",
  },
  {
    id: "chess",
    name: "Chess Duel",
    description: "Turn-based and speed chess matches with room-based multiplayer.",
    icon: Swords,
    status: "coming-soon",
  },
  {
    id: "word",
    name: "Word Sprint",
    description: "Fast-paced multiplayer word rounds and team scoreboards.",
    icon: Sparkles,
    status: "coming-soon",
  },
];

export default function HomePage() {
  const [selectedModeId, setSelectedModeId] = useState<GameMode["id"]>("quiz");

  const selectedMode = useMemo(
    () => GAME_MODES.find((mode) => mode.id === selectedModeId) ?? GAME_MODES[0],
    [selectedModeId]
  );

  const isQuizMode = selectedMode.status === "available";

  return (
    <div className="game-screen items-center justify-center gradient-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <BrandedBackground
        imagePath="/designs/backgrounds/Public_One.avif"
        brandMarkClassName="absolute inset-0 m-auto h-[520px] w-[520px] object-contain opacity-[0.18]"
      />

      <div className="text-center space-y-8 px-4 relative z-10 rounded-2xl glass p-8 sm:p-10 border border-[#EEDC00]/20 max-w-6xl w-full mx-4">
        <div className="space-y-3">
          <img
            src={withBasePath("/logo.svg")}
            alt="TUKOPAMOJA"
            className="h-16 sm:h-20 w-auto mx-auto opacity-95"
          />
          <h1 className="text-5xl sm:text-7xl font-serif font-bold tracking-tight">
            <span className="text-black dark:gradient-ens dark:bg-clip-text dark:text-transparent text-glow">
              TUKOPAMOJA
            </span>
          </h1>
          <p className="text-lg text-foreground/80 dark:text-white/70 tracking-wide">
            Premium multiplayer arena for quiz, puzzle, strategy, and word games.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.25em] text-foreground/60 dark:text-white/60">
            <span>Select game mode</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-left">
            {GAME_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedModeId === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedModeId(mode.id)}
                  className={`rounded-2xl border p-4 transition-all duration-300 ${
                    isSelected
                      ? "border-[#EEDC00]/60 bg-[#EEDC00]/12 shadow-[0_0_0_1px_rgba(238,220,0,0.18)]"
                      : "border-white/10 bg-white/5 hover:border-[#EEDC00]/35 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EEDC00]/30 bg-[#EEDC00]/12">
                      <Icon className="h-5 w-5 text-[#B18A00] dark:text-[#EEDC00]" />
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        mode.status === "available"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-foreground/65 dark:text-white/70"
                      }`}
                    >
                      {mode.status === "available" ? "Live" : "Coming soon"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h2 className="text-lg font-serif font-bold text-foreground dark:text-white">
                      {mode.name}
                    </h2>
                    <p className="text-sm text-foreground/70 dark:text-white/70 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-foreground dark:text-white">Selected mode: {selectedMode.name}</p>
          <p className="text-sm text-foreground/70 dark:text-white/70 mt-1">
            {isQuizMode
              ? "Quiz mode is fully available right now with multiplayer host and player flows."
              : `${selectedMode.name} is planned as a multiplayer mode and is marked coming soon for now.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isQuizMode ? (
            <>
              <Link href="/auth/login">
                <Button
                  size="xl"
                  className="w-full sm:w-auto gradient-primary border-0 btn-3d text-black font-semibold tracking-wide hover:opacity-90"
                >
                  Host Quiz Game
                </Button>
              </Link>
              <Link href="/join">
                <Button
                  size="xl"
                  variant="outline"
                  className="w-full sm:w-auto border-[#EEDC00]/30 text-foreground dark:text-white hover:border-[#EEDC00]/50 hover:bg-black/5 dark:hover:bg-[#EEDC00]/10 transition-all duration-300"
                >
                  Join as Player
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button
                size="xl"
                disabled
                className="w-full sm:w-auto gradient-primary border-0 btn-3d text-black font-semibold tracking-wide opacity-70"
              >
                {selectedMode.name} Coming Soon
              </Button>
              <Button
                size="xl"
                variant="outline"
                disabled
                className="w-full sm:w-auto border-[#EEDC00]/30 text-foreground dark:text-white opacity-70"
              >
                Multiplayer setup coming soon
              </Button>
            </>
          )}
        </div>

        <div className="pt-4 space-y-2">
          <p className="text-xs text-foreground/55 dark:text-ens-slate-light/60 uppercase tracking-[0.2em]">
            Powered by ENS Africa
          </p>
          <div className="w-12 h-[1px] mx-auto bg-gradient-to-r from-transparent via-ens-crimson/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
