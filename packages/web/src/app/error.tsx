"use client";

import { useEffect } from "react";

/**
 * Global error boundary — catches unhandled exceptions in the React tree
 * and shows a recovery UI instead of a blank white page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TUKOPAMOJA] Unhandled error:", error);
  }, [error]);

  const isEnvError = error.message?.includes("environment variables");

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-6 text-foreground">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="text-5xl" role="img" aria-label="warning">
          ⚠️
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          {isEnvError ? "Configuration Required" : "Something went wrong"}
        </h1>

        {isEnvError ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              The app cannot connect to the backend because required environment
              variables are missing.
            </p>
            <pre className="rounded-lg bg-muted p-4 text-left text-xs leading-relaxed whitespace-pre-wrap">
              {error.message}
            </pre>
            <p>
              If you&apos;re deploying this app, make sure{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              and{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              are set before building.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Try refreshing the page.
          </p>
        )}

        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
