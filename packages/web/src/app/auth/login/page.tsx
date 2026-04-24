"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { withBasePath } from "@/lib/base-path";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setShowResetSuccess(query.get("reset") === "success");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
      } else {
        setMessage("Account created. Check your email to confirm, then sign in.");
      }
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    setLoading(false);
  }

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <img
        src={withBasePath("/designs/backgrounds/brand-watermark.svg")}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 m-auto w-[360px] h-[360px] object-contain opacity-[0.08] pointer-events-none"
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-ens-crimson/5 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md glass-card-elevated relative z-10">
        <CardHeader className="text-center">
          <img
            src={withBasePath("/logo.svg")}
            alt="QuizArena"
            className="h-12 w-auto mx-auto mb-2"
          />
          <CardTitle className="text-2xl font-serif">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Sign up to start creating quizzes"
              : "Sign in to your host dashboard"}
          </CardDescription>
          {showResetSuccess && (
            <p className="text-sm text-quiz-green">
              Password updated. Sign in with your new password.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {message && (
              <p className="text-sm text-quiz-green">{message}</p>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary border-0 btn-3d text-white font-semibold"
              size="lg"
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </Button>

            {!isSignUp && (
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/auth/reset-password" className="text-primary underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
              </p>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary underline-offset-4 hover:underline"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
