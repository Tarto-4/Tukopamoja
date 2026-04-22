/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@quizarena/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

module.exports = nextConfig;
