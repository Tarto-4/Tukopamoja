import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="game-screen items-center justify-center gradient-dark">
      <div className="text-center space-y-8 px-4">
        {/* Logo / brand */}
        <div className="space-y-2">
          <h1 className="text-5xl sm:text-7xl font-display font-black tracking-tight">
            <span className="gradient-primary bg-clip-text text-transparent">
              QuizArena
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-time quiz platform for your team
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login">
            <Button size="xl" className="w-full sm:w-auto gradient-primary border-0">
              🎯 Host a Game
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground pt-8">
          Players join on their phones via QR code
        </p>
      </div>
    </div>
  );
}
