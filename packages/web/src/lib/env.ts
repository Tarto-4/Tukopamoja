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
  const errors: string[] = [];

  for (const key of REQUIRED_VARS) {
    const value = process.env[key];
    if (!value || value === "placeholder" || value.trim() === "") {
      errors.push(`  ✗ ${key} is missing or placeholder`);
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (supabaseUrl && !isValidUrl(supabaseUrl)) {
    errors.push(`  ✗ NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${supabaseUrl}"`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (appUrl && !isValidUrl(appUrl)) {
    errors.push(`  ✗ NEXT_PUBLIC_APP_URL is not a valid URL: "${appUrl}"`);
  }

  if (errors.length > 0) {
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

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_MOBILE_SCHEME: process.env.NEXT_PUBLIC_MOBILE_SCHEME!,
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
