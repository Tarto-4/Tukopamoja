"use client";

import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlayerStore, randomAvatar } from "@/stores/usePlayerStore";
import { useBrandingStore } from "@/stores/useBrandingStore";
import { Gamepad2, ArrowRight, RefreshCw } from "lucide-react";
import GameLogo from "@/components/ui/GameLogo";

function JoinPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPin = searchParams.get("pin") || "";

  const [pin, setPin] = useState(initialPin);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(randomAvatar());
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const { joinSession } = usePlayerStore();
  const { fetchBranding } = useBrandingStore();

  useEffect(() => { fetchBranding(); }, [fetchBranding]);

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
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanPin || !/^\d{4,8}$/.test(cleanPin)) {
      setError("Enter a valid game PIN (4–8 digits).");
      return;
    }
    if (!cleanFirst || cleanFirst.length < 1 || cleanFirst.length > 30) {
      setError("Enter your first name (1–30 characters).");
      return;
    }
    if (!cleanLast || cleanLast.length < 1 || cleanLast.length > 30) {
      setError("Enter your surname (1–30 characters).");
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
      const sessionId = await joinSession(cleanPin, cleanFirst, cleanLast, cleanEmail);
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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#eecd00]/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 rounded-2xl glass p-6 border border-primary/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30">
            <Gamepad2 className="w-7 h-7 mx-auto text-primary" />
          </div>
          <GameLogo size="md" static />
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
              className="p-3 rounded-full bg-white/5 border border-white/15 hover:bg-primary/10 hover:border-primary/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Change avatar"
              title="Change avatar"
            >
              <RefreshCw className="w-5 h-5" />
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
                         rounded-xl border border-border bg-input px-4 text-foreground caret-primary
                         placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/60 transition-colors"
              autoFocus={!initialPin}
            />
          </div>

          {/* Name inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <input
                id="firstName"
                type="text"
                maxLength={30}
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-12 rounded-xl border border-border bg-input px-4 text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/60 transition-colors"
                autoFocus={!!initialPin}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">
                Surname
              </label>
              <input
                id="lastName"
                type="text"
                maxLength={30}
                placeholder="Surname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-12 rounded-xl border border-border bg-input px-4 text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/60 transition-colors"
              />
            </div>
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
              className="w-full h-12 rounded-xl border border-border bg-input px-4 text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/60 transition-colors"
              autoComplete="email"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive text-center font-medium" role="alert">{error}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            size="xl"
            disabled={joining}
            variant="game"
            className="w-full text-lg"
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
