"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

function JoinPageContent() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";
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
              Don't have the app open yet?{" "}
              <a
                href="https://expo.dev/go"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                Install Expo Go
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              Then open the QuizArena app and enter this PIN manually.
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

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="game-screen items-center justify-center gradient-dark px-4">
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
