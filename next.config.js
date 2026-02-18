/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  eslint: {
    // ESLint is replaced by Biome; disable Next.js built-in ESLint during builds
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
