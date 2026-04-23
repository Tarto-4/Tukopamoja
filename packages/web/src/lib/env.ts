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

  if (errors.length > 0 && isProd) {
    const msg = [
      "",
      "╔══════════════════════════════════════════════════════╗",
      "║        QuizArena — Environment Configuration        ║",
      "╚══════════════════════════════════════════════════════╝",
      "",
      "The following environment variables have problems:",
      "",
      ...errors,
      "",
      "Copy .env.local.example → .env.local and fill in real values.",
      "",
    ].join("\n");

    throw new Error(msg);
  }

  if (errors.length > 0 && !isProd) {
    console.warn(
      [
        "[QuizArena] Missing/invalid env vars detected in development.",
        "Using safe local defaults for development mode.",
        ...errors,
      ].join("\n")
    );
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
      : "quizarena";

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
