import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hookform/resolvers"],
  // Improve production error messages
  productionBrowserSourceMaps: false,
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  experimental: {
    // Increase body size limit for Server Actions (for file uploads)
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
