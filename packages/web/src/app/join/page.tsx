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
  const [email, setEmail] = useState("");
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
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanPin || !/^\d{4,8}$/.test(cleanPin)) {
      setError("Enter a valid game PIN (4–8 digits).");
      return;
    }
    if (!cleanName || cleanName.length < 1 || cleanName.length > 20) {
      setError("Pick a nickname (1–20 characters).");
      return;
    }
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setJoining(true);

    try {
      // Set avatar before joining
      usePlayerStore.setState({ avatar });
      const sessionId = await joinSession(cleanPin, cleanName, cleanEmail);
      router.push(`/play/?sessionId=${sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join game.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#EEDC00]/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 rounded-2xl glass p-6 border border-[#EEDC00]/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEDC00]/15 border border-[#EEDC00]/30">
            <Gamepad2 className="w-7 h-7 mx-auto text-[#EEDC00]" />
          </div>
          <h1 className="text-3xl font-serif font-black gradient-ens bg-clip-text text-transparent">
            QuizArena
          </h1>
          <p className="text-white/70 text-sm">
            Join a live quiz game
          </p>
        </div>

        {/* Join form */}
        <form onSubmit={handleJoin} className="space-y-4 rounded-2xl glass p-6 border border-white/15">
          {/* Avatar picker */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl">{avatar}</span>
            <button
              type="button"
              onClick={refreshAvatar}
              className="p-2 rounded-full bg-white/5 border border-white/15 hover:bg-[#EEDC00]/10 hover:border-[#EEDC00]/30 transition-colors"
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
              className="w-full h-14 text-center text-3xl font-serif font-black tracking-[0.3em]
                         rounded-xl border border-white/15 bg-white/5 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#EEDC00]/20 focus:border-[#EEDC00]/50"
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
              className="w-full h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-lg font-medium text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#EEDC00]/20 focus:border-[#EEDC00]/50"
              autoFocus={!!initialPin}
            />
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              maxLength={120}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-base font-medium text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#EEDC00]/20 focus:border-[#EEDC00]/50"
              autoComplete="email"
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
            className="w-full gradient-primary border-0 text-lg btn-3d text-black font-semibold"
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
