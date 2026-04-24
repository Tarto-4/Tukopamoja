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
import ThemeToggle from "@/components/theme/ThemeToggle";

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
  const [showConfirmSuccess, setShowConfirmSuccess] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setShowResetSuccess(query.get("reset") === "success");
    setShowConfirmSuccess(query.get("confirmed") === "1");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const confirmationUrl = new URL(withBasePath("/auth/login-v2/?confirmed=1"), window.location.origin).toString();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: confirmationUrl },
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        await supabase.auth.signOut();
        setMessage("Account created, but email confirmation is disabled for this project. Enable 'Confirm email' in Supabase Auth settings to require verification.");
        setPendingConfirmationEmail(email.trim());
      } else {
        const normalizedEmail = email.trim();
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: normalizedEmail,
          options: { emailRedirectTo: confirmationUrl },
        });

        if (resendError && !/rate limit/i.test(resendError.message)) {
          setMessage("Account created. Verification email may be delayed. Use resend below if needed.");
        } else {
          setMessage("Account created. Check your email to confirm, then sign in.");
        }
        setPendingConfirmationEmail(normalizedEmail);
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

  async function handleResendConfirmation() {
    if (!pendingConfirmationEmail) return;
    setLoading(true);
    setError(null);
    const confirmationUrl = new URL(withBasePath("/auth/login-v2/?confirmed=1"), window.location.origin).toString();

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: pendingConfirmationEmail,
      options: { emailRedirectTo: confirmationUrl },
    });

    if (resendError) {
      setError(resendError.message);
    } else {
      setMessage("Confirmation email sent. Check your inbox and spam folder.");
    }
    setLoading(false);
  }

  return (
    <div className="game-screen items-center justify-center gradient-dark px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 accent-bar z-20" />
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle className="h-9 px-3 glass border-[#EEDC00]/30 text-white hover:bg-black/60" />
      </div>

      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-8 left-[7%] h-28 w-28 rounded-full bg-[#EEDC00]/20 blur-md" />
        <div className="absolute top-20 left-[30%] h-20 w-20 rounded-full bg-[#F5E500]/18 blur-md" />
        <div className="absolute top-[45%] right-[12%] h-24 w-24 rounded-full bg-[#D4C500]/18 blur-md" />
        <div className="absolute bottom-[12%] left-[24%] h-16 w-16 rounded-full bg-[#EEDC00]/16 blur-md" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/35 to-transparent" />
      </div>

      {/* Ambient glow */}
      <img
        src={withBasePath("/designs/backgrounds/brand-mark-overlay.svg")}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 m-auto w-[420px] h-[420px] object-contain opacity-[0.2] pointer-events-none z-10"
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-ens-crimson/5 blur-[120px] pointer-events-none z-10" />

      <Card className="w-full max-w-md glass relative z-20 border-[#EEDC00]/20">
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
          {showConfirmSuccess && (
            <p className="text-sm text-quiz-green">
              Email confirmed successfully. You can sign in now.
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
              <div className="space-y-2">
                <p className="text-sm text-quiz-green">{message}</p>
                {pendingConfirmationEmail && isSignUp && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#EEDC00]/30"
                    onClick={handleResendConfirmation}
                    disabled={loading}
                  >
                    {loading ? "Resending..." : "Resend confirmation email"}
                  </Button>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary border-0 btn-3d text-black font-semibold"
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
