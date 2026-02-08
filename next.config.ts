import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hookform/resolvers"],
  // Improve production error messages
  productionBrowserSourceMaps: false,
  // Optimize for production
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
