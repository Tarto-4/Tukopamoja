import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="game-screen items-center justify-center gradient-dark relative overflow-hidden">
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-ens-crimson/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-ens-gold/3 blur-[100px]" />
      </div>

      <div className="text-center space-y-10 px-4 relative z-10">
        {/* Logo / brand */}
        <div className="space-y-3">
          <img
            src="/logo.svg"
            alt="QuizArena"
            className="h-16 sm:h-20 w-auto mx-auto opacity-95"
          />
          <h1 className="text-5xl sm:text-7xl font-serif font-bold tracking-tight">
            <span className="gradient-ens bg-clip-text text-transparent text-glow">
              QuizArena
            </span>
          </h1>
          <p className="text-lg text-ens-slate-light tracking-wide">
            Premium real-time quiz platform
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login">
            <Button
              size="xl"
              className="w-full sm:w-auto gradient-primary border-0 btn-3d text-white font-semibold tracking-wide"
            >
              Host a Game
            </Button>
          </Link>
          <Link href="/join">
            <Button
              size="xl"
              variant="outline"
              className="w-full sm:w-auto border-ens-slate hover:border-ens-crimson/50 hover:bg-ens-crimson/5 transition-all duration-300"
            >
              Join as Player
            </Button>
          </Link>
        </div>

        {/* Powered by */}
        <div className="pt-8 space-y-2">
          <p className="text-xs text-ens-slate-light/60 uppercase tracking-[0.2em]">
            Powered by ENS Africa
          </p>
          <div className="w-12 h-[1px] mx-auto bg-gradient-to-r from-transparent via-ens-crimson/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
