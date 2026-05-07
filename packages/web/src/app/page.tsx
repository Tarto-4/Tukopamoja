"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BrandedBackground from "@/components/ui/BrandedBackground";
import GameLogo from "@/components/ui/GameLogo";
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
    <div className="game-screen items-center justify-start md:justify-center gradient-dark relative overflow-y-auto py-8">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <BrandedBackground
        imagePath="/designs/backgrounds/dt-wallpaper.png"
        brandMarkClassName="absolute inset-0 m-auto h-[300px] w-[300px] sm:h-[420px] sm:w-[420px] md:h-[520px] md:w-[520px] object-contain opacity-[0.18]"
      />

      <div className="text-center space-y-8 px-4 relative z-10 rounded-2xl glass p-8 sm:p-10 border border-primary/20 max-w-6xl w-full mx-4">
        <div className="space-y-3">
          <GameLogo size="xl" showSubtitle className="animate-float-in" />
          <p className="text-lg text-white/80 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            Premium multiplayer arena for quiz, puzzle, strategy, and word games.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.25em] text-white/60">
            <span>Select game mode</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-left">
            {GAME_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedModeId === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  data-mode-id={mode.id}
                  onClick={() => setSelectedModeId(mode.id)}
                  className={`relative rounded-2xl p-5 transition-all duration-300 game-card backdrop-blur-xl ${
                    isSelected
                      ? "bg-gradient-to-br from-[rgba(0,0,0,0.75)] to-[rgba(0,0,0,0.7)] border-2 border-[#EEDC00] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_16px_rgba(238,220,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]"
                      : "bg-gradient-to-br from-[rgba(0,0,0,0.6)] to-[rgba(0,0,0,0.55)] border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.05)] hover:border-[#EEDC00]/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_8px_rgba(238,220,0,0.1)]"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-4 right-4 h-[3px] rounded-b-full bg-gradient-to-r from-[#EEDC00] via-[#EEDC00]/60 to-transparent" />
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                      isSelected
                        ? "border-[#EEDC00]/50 bg-[#EEDC00]/20"
                        : "border-white/20 bg-white/10"
                    }`}>
                      <Icon className={`h-5 w-5 ${isSelected ? "text-[#EEDC00]" : "text-white/80"}`} />
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        mode.status === "available"
                          ? "bg-emerald-500/30 text-emerald-200 border border-emerald-500/30"
                          : "bg-white/10 text-white/70 border border-white/10"
                      }`}
                    >
                      {mode.status === "available" ? "Live" : "Coming soon"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h2 className={`text-lg font-bold ${isSelected ? "text-[#EEDC00] drop-shadow-[0_0_8px_rgba(238,220,0,0.4)]" : "text-white"}`}>
                      {mode.name}
                    </h2>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-black/40 backdrop-blur-sm px-4 py-4 max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-white">Selected mode: {selectedMode.name}</p>
          <p className="text-sm text-white/70 mt-1">
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
                  variant="game"
                  className="w-full sm:w-auto tracking-wide"
                >
                  Host Quiz Game
                </Button>
              </Link>
              <Link href="/join">
                <Button
                  size="xl"
                  variant="game-outline"
                  className="w-full sm:w-auto"
                >
                  Join as Player
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button
                size="xl"
                variant="game"
                disabled
                className="w-full sm:w-auto tracking-wide opacity-60"
              >
                {selectedMode.name} Coming Soon
              </Button>
              <Button
                size="xl"
                variant="game-outline"
                disabled
                className="w-full sm:w-auto opacity-60"
              >
                Multiplayer setup coming soon
              </Button>
            </>
          )}
        </div>

        <div className="pt-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
            Powered by ENS Africa
          </p>
          <div className="w-12 h-[1px] mx-auto bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
