"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlayerStore, randomAvatar } from "@/stores/usePlayerStore";
import { Gamepad2, ArrowRight, RefreshCw } from "lucide-react";

function JoinPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPin = searchParams.get("pin") || "";

  const [pin, setPin] = useState(initialPin);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(randomAvatar());
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const { joinSession } = usePlayerStore();

  // Update avatar in store when changed
  const refreshAvatar = () => {
    const next = randomAvatar();
    setAvatar(next);
    usePlayerStore.setState({ avatar: next });
  };

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanPin = pin.trim();
    const cleanName = nickname.trim();

    if (!cleanPin || !/^\d{4,8}$/.test(cleanPin)) {
      setError("Enter a valid game PIN (4–8 digits).");
      return;
    }
    if (!cleanName || cleanName.length < 1 || cleanName.length > 20) {
      setError("Pick a nickname (1–20 characters).");
      return;
    }

    setJoining(true);

    try {
      // Set avatar before joining
      usePlayerStore.setState({ avatar });
      const sessionId = await joinSession(cleanPin, cleanName);
      router.push(`/play/?sessionId=${sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join game.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Gamepad2 className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-3xl font-display font-black gradient-primary bg-clip-text text-transparent">
            QuizArena
          </h1>
          <p className="text-muted-foreground text-sm">
            Join a live quiz game
          </p>
        </div>

        {/* Join form */}
        <form onSubmit={handleJoin} className="space-y-4">
          {/* Avatar picker */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl">{avatar}</span>
            <button
              type="button"
              onClick={refreshAvatar}
              className="p-2 rounded-full bg-card border hover:bg-accent transition-colors"
              title="Change avatar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* PIN input */}
          <div className="space-y-1.5">
            <label htmlFor="pin" className="text-sm font-medium text-muted-foreground">
              Game PIN
            </label>
            <input
              id="pin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder="123456"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full h-14 text-center text-3xl font-display font-black tracking-[0.3em]
                         rounded-xl border bg-card px-4 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus={!initialPin}
            />
          </div>

          {/* Nickname input */}
          <div className="space-y-1.5">
            <label htmlFor="nickname" className="text-sm font-medium text-muted-foreground">
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              maxLength={20}
              placeholder="Your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full h-12 rounded-xl border bg-card px-4 text-lg font-medium
                         focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus={!!initialPin}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-quiz-red text-center">{error}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            size="xl"
            disabled={joining}
            className="w-full gradient-primary border-0 text-lg"
          >
            {joining ? (
              "Joining..."
            ) : (
              <>
                Join Game
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Optional app link */}
        <p className="text-center text-xs text-muted-foreground">
          Have the mobile app?{" "}
          <a
            href={`${process.env.NEXT_PUBLIC_MOBILE_SCHEME || "quizarena"}://join?pin=${pin}`}
            className="text-primary underline"
          >
            Open in app
          </a>
        </p>
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
