import Link from "next/link";
import { Button } from "@/components/ui/button";
import { withBasePath } from "@/lib/base-path";
import BrandedBackground from "@/components/ui/BrandedBackground";

export default function HomePage() {
  return (
    <div className="game-screen items-center justify-center gradient-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <BrandedBackground
        imagePath="/designs/backgrounds/Public_One.avif"
        brandMarkClassName="absolute inset-0 m-auto h-[520px] w-[520px] object-contain opacity-[0.18]"
      />

      <div className="text-center space-y-10 px-4 relative z-10 rounded-2xl glass p-8 sm:p-10 border border-[#EEDC00]/20">
        {/* Logo / brand */}
        <div className="space-y-3">
          <img
            src={withBasePath("/logo.svg")}
            alt="QuizArena"
            className="h-16 sm:h-20 w-auto mx-auto opacity-95"
          />
          <h1 className="text-5xl sm:text-7xl font-serif font-bold tracking-tight">
            <span className="gradient-ens bg-clip-text text-transparent text-glow">
              QuizArena
            </span>
          </h1>
          <p className="text-lg text-foreground/80 dark:text-white/70 tracking-wide">
            Premium real-time quiz platform
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login-v2">
            <Button
              size="xl"
              className="w-full sm:w-auto gradient-primary border-0 btn-3d text-black font-semibold tracking-wide hover:opacity-90"
            >
              Host a Game
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
        </div>

        {/* Powered by */}
        <div className="pt-8 space-y-2">
          <p className="text-xs text-foreground/55 dark:text-ens-slate-light/60 uppercase tracking-[0.2em]">
            Powered by ENS Africa
          </p>
          <div className="w-12 h-[1px] mx-auto bg-gradient-to-r from-transparent via-ens-crimson/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
