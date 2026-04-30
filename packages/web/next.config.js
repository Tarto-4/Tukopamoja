// ─────────────────────────────────────────────────────────────
// BUILD_MODE controls how Next.js outputs the build:
//   "static" → static HTML export (default, GitHub Pages / CDN)
//   "server" → standard build for `next start` (Docker / cloud)
//
// Set BUILD_MODE=server for server deployments.
// ─────────────────────────────────────────────────────────────

const buildMode = process.env.BUILD_MODE || "static";
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

let basePath = "";
if (appUrl) {
  try {
    const parsed = new URL(appUrl);
    const normalizedPath = parsed.pathname.replace(/\/$/, "");
    if (normalizedPath && normalizedPath !== "/") {
      basePath = normalizedPath;
    }
  } catch {
    basePath = "";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@quizarena/shared"],

  // ── Static export mode (GitHub Pages / nginx) ──
  ...(buildMode === "static" && {
    output: "export",
    trailingSlash: true,
    basePath,
    assetPrefix: basePath || undefined,
    images: { unoptimized: true },
  }),

  // ── Server mode (Docker / cloud — `next start`) ──
  ...(buildMode === "server" && {
    images: { unoptimized: true },
  }),
};

module.exports = nextConfig;
