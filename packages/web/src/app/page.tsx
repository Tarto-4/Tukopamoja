"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import BrandedBackground from "@/components/ui/BrandedBackground";
import GameLogo from "@/components/ui/GameLogo";

export default function HomePage() {
  return (
    <div className="game-screen items-center justify-start md:justify-center gradient-dark relative py-8">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <BrandedBackground
        imagePath="/designs/backgrounds/dt-wallpaper.png"
        brandMarkClassName="absolute inset-0 m-auto h-[min(300px,65vw)] w-[min(300px,65vw)] sm:h-[min(420px,50vw)] sm:w-[min(420px,50vw)] md:h-[min(520px,45vw)] md:w-[min(520px,45vw)] object-contain opacity-[0.18]"
      />

      <div className="text-center space-y-8 px-4 relative z-10 rounded-2xl glass p-8 sm:p-10 border border-primary/20 max-w-2xl w-full mx-4">
        <GameLogo size="xl" className="animate-float-in" />

        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Live multiplayer quiz battles with presenter-led rounds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
