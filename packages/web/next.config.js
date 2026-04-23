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
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  transpilePackages: ["@quizarena/shared"],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
