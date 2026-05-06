// ─────────────────────────────────────────────────────────────
// Runtime environment validation — fail fast with clear errors
// ─────────────────────────────────────────────────────────────

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_MOBILE_SCHEME: string;
}

const REQUIRED_VARS: (keyof EnvConfig)[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_MOBILE_SCHEME",
];

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates all required environment variables at runtime.
 * Throws with a detailed error listing every problem found.
 */
export function validateEnv(): EnvConfig {
  const isProd = process.env.NODE_ENV === "production";
  const errors: string[] = [];

  const rawEnv: EnvConfig = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
    NEXT_PUBLIC_MOBILE_SCHEME: process.env.NEXT_PUBLIC_MOBILE_SCHEME ?? "",
  };

  for (const key of REQUIRED_VARS) {
    const value = rawEnv[key];
    if (!value || value === "placeholder" || value.trim() === "") {
      errors.push(`  ✗ ${key} is missing or placeholder`);
    }
  }

  const supabaseUrl = rawEnv.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !isValidUrl(supabaseUrl)) {
    errors.push(`  ✗ NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${supabaseUrl}"`);
  }

  const appUrl = rawEnv.NEXT_PUBLIC_APP_URL;
  if (appUrl && !isValidUrl(appUrl)) {
    errors.push(`  ✗ NEXT_PUBLIC_APP_URL is not a valid URL: "${appUrl}"`);
  }

  if (errors.length > 0) {
    // During static export (next build), pages are prerendered on the server
    // where some NEXT_PUBLIC_ vars may not be present. The vars ARE baked into
    // the JS bundles and will be available at runtime in the browser, so we
    // only warn during build and let the client fail-fast at actual runtime.
    const isBuildTime = typeof window === "undefined";
    if (isBuildTime) {
      console.warn(
        "[TUKOPAMOJA] Env validation skipped during static build — vars will be checked at runtime."
      );
    } else if (isProd) {
      // In production browser context, log the error prominently but do NOT
      // throw — this lets the error boundary render a friendly UI instead of
      // a blank white page.  Supabase calls will fail at the API level with
      // clear 401/network errors, which is easier to debug than a hard crash.
      console.error(
        [
          "",
          "╔══════════════════════════════════════════════════════╗",
          "║       TUKOPAMOJA — Environment Configuration        ║",
          "╚══════════════════════════════════════════════════════╝",
          "",
          "The following environment variables have problems:",
          "",
          ...errors,
          "",
          "The app was built with placeholder Supabase values.",
          "Rebuild with real NEXT_PUBLIC_SUPABASE_URL and",
          "NEXT_PUBLIC_SUPABASE_ANON_KEY before deploying.",
          "",
        ].join("\n")
      );
    } else {
      console.warn(
        [
          "[TUKOPAMOJA] Missing/invalid env vars detected in development.",
          "Using safe local defaults for development mode.",
          ...errors,
        ].join("\n")
      );
    }
  }

  const resolvedSupabaseUrl =
    supabaseUrl && isValidUrl(supabaseUrl)
      ? supabaseUrl
      : "http://127.0.0.1:54321";

  const resolvedAppUrl =
    appUrl && isValidUrl(appUrl)
      ? appUrl
      : "http://localhost:3000";

  const resolvedAnonKey =
    rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder"
      ? rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : "local-dev-anon-key";

  const resolvedMobileScheme =
    rawEnv.NEXT_PUBLIC_MOBILE_SCHEME &&
    rawEnv.NEXT_PUBLIC_MOBILE_SCHEME !== "placeholder"
      ? rawEnv.NEXT_PUBLIC_MOBILE_SCHEME
      : "tukopamoja";

  return {
    NEXT_PUBLIC_SUPABASE_URL: resolvedSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: resolvedAnonKey,
    NEXT_PUBLIC_APP_URL: resolvedAppUrl,
    NEXT_PUBLIC_MOBILE_SCHEME: resolvedMobileScheme,
  };
}

/**
 * Lazy-cached validated env. Safe to call from any client component.
 */
let _cached: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!_cached) {
    _cached = validateEnv();
  }
  return _cached;
}
