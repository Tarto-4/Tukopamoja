#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Build-time / CI environment validation script
// Usage:  node scripts/validate-env.mjs [--production]
// Exit 1 on any missing/invalid required variable.
// Auto-loads packages/web/.env.local when present.
// ─────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localEnvFile = resolve(__dirname, "../packages/web/.env.local");
const productionEnvFile = resolve(__dirname, "../packages/web/.env.production");

function loadEnvFile(envFile) {
  if (!existsSync(envFile)) return;
  const lines = readFileSync(envFile, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const isProd = process.argv.includes("--production");

if (isProd) {
  loadEnvFile(productionEnvFile);
} else {
  loadEnvFile(localEnvFile);
}

const REQUIRED = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", validate: isUrl },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", validate: isNonEmpty },
  { key: "NEXT_PUBLIC_APP_URL", validate: isUrl },
  { key: "NEXT_PUBLIC_MOBILE_SCHEME", validate: isNonEmpty },
];

const LOCALHOST_PATTERNS = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];

function isUrl(val) {
  try { new URL(val); return true; } catch { return false; }
}

function isNonEmpty(val) {
  return val && val.trim() !== "" && val !== "placeholder";
}

function isLocalhost(val) {
  try {
    const hostname = new URL(val).hostname;
    return LOCALHOST_PATTERNS.includes(hostname);
  } catch {
    return false;
  }
}

const errors = [];

for (const { key, validate } of REQUIRED) {
  const val = process.env[key];
  if (!val || !validate(val)) {
    errors.push(`  ✗ ${key} = ${val ?? "(unset)"}`);
  } else if (isProd && isUrl(val) && isLocalhost(val)) {
    errors.push(`  ✗ ${key} points to localhost in production mode: ${val}`);
  }
}

if (errors.length > 0) {
  console.error("\n✗  Environment validation failed:\n");
  errors.forEach((e) => console.error(e));
  if (isProd) {
    console.error("\nSet production vars in shell or create packages/web/.env.production from .env.production.example.\n");
  } else {
    console.error("\nCopy .env.local.example → .env.local and fill in real values.\n");
  }
  process.exit(1);
}

if (isProd) {
  console.log("✓  Production environment validated — all variables present and non-localhost.");
} else {
  console.log("✓  Environment validated — all required variables present.");
}
