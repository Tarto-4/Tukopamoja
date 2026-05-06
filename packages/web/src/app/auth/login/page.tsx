"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { withBasePath } from "@/lib/base-path";
import ThemeToggle from "@/components/theme/ThemeToggle";
import BrandedBackground from "@/components/ui/BrandedBackground";
import GameLogo from "@/components/ui/GameLogo";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [showConfirmSuccess, setShowConfirmSuccess] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const toFriendlyAuthError = (value: string) => {
    if (/already registered|already exists|user already registered|email already/i.test(value)) {
      return "An account with this email already exists. Sign in or reset your password.";
    }
    return value;
  };

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

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const confirmationUrl = new URL(withBasePath("/auth/login/?confirmed=1"), window.location.origin).toString();
      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: confirmationUrl },
      });
      if (authError) {
        setError(toFriendlyAuthError(authError.message));
        setLoading(false);
        return;
      }

      const duplicateEmailDetected = Boolean(data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);

      if (duplicateEmailDetected) {
        setError("An account with this email already exists. Sign in or reset your password.");
        setPendingConfirmationEmail(null);
        setIsSignUp(false);
        setLoading(false);
        return;
      }

      if (data.session) {
        await supabase.auth.signOut();
        setMessage("Account created, but email confirmation is disabled for this project. Enable 'Confirm email' in Supabase Auth settings to require verification.");
        setPendingConfirmationEmail(normalizedEmail);
      } else {
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

    const { error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (authError) {
      setError(toFriendlyAuthError(authError.message));
      setLoading(false);
      return;
    }

    router.push(getRedirectPath());
    setLoading(false);
  }

  // Resolve post-login redirect destination (middleware may set ?redirect=/dashboard/templates)
  function getRedirectPath(): string {
    if (typeof window === "undefined") return "/dashboard";
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    // Only allow internal /dashboard paths to prevent open redirect
    if (redirect && redirect.startsWith("/dashboard")) return redirect;
    return "/dashboard";
  }

  async function handleResendConfirmation() {
    if (!pendingConfirmationEmail) return;
    setLoading(true);
    setError(null);
    const confirmationUrl = new URL(withBasePath("/auth/login/?confirmed=1"), window.location.origin).toString();

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
        <ThemeToggle className="h-9 px-3 glass border-[#eecd00]/30 text-white hover:bg-black/60" />
      </div>

      <BrandedBackground
        imagePath="/designs/backgrounds/dt-wallpaper.png"
        imageClassName="absolute inset-0 h-full w-full object-cover object-center opacity-100"
        overlayClassName="bg-black/42"
        className="z-0"
      />

      <Card className="w-full max-w-md glass relative z-20 border-[#eecd00]/20">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex justify-center">
            <GameLogo size="md" static />
          </Link>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="email"
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert" aria-live="polite">{error}</p>
            )}

            {message && (
              <div className="space-y-2">
                <p className="text-sm text-quiz-green">{message}</p>
                {pendingConfirmationEmail && isSignUp && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#eecd00]/30"
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
              disabled={loading || !email.trim() || !password}
            >
              {loading
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
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
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                className="text-primary underline-offset-4 hover:underline"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>

            <p className="text-center text-xs text-white/60">
              <Link href="/" className="hover:text-white underline-offset-4 hover:underline">
                Back to home
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
