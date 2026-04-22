// ─────────────────────────────────────────────────────────────
// QuizArena Web — Join redirect page (web fallback for QR deep links)
// When scanned on a device without the app, shows a join link.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  searchParams: { pin?: string };
}

export default function JoinPage({ searchParams }: Props) {
  const pin = searchParams.pin || "";
  const mobileScheme = process.env.NEXT_PUBLIC_MOBILE_SCHEME || "quizarena";
  const deepLink = `${mobileScheme}://join?pin=${pin}`;

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-display font-black gradient-primary bg-clip-text text-transparent">
          QuizArena
        </h1>
        <p className="text-muted-foreground">
          Join a live quiz game
        </p>

        {pin && (
          <div className="bg-card rounded-2xl p-6 space-y-4">
            <p className="text-muted-foreground text-sm">Game PIN</p>
            <p className="text-5xl font-display font-black tracking-widest">
              {pin}
            </p>

            <a href={deepLink}>
              <Button size="xl" className="w-full gradient-primary border-0">
                Open in App
              </Button>
            </a>

            <p className="text-xs text-muted-foreground">
              Don't have the app?{" "}
              <a href="#" className="text-primary underline">
                Download it here
              </a>
            </p>
          </div>
        )}

        {!pin && (
          <p className="text-muted-foreground">
            Scan a QR code from the host screen to join a game.
          </p>
        )}
      </div>
    </div>
  );
}
