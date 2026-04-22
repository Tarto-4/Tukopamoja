/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@quizarena/shared"],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
