import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // silencia ESLint en build
  eslint: { ignoreDuringBuilds: true },  
  // silencia TS en build
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
