import type { NextConfig } from "next";

const securityHeaders = [
  // Impede que o site seja embutido em iframes (proteção contra Clickjacking)
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Impede MIME sniffing pelo navegador
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Controla informações de referência enviadas
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Ativa proteção XSS nos navegadores legados
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Força HTTPS por 1 ano (incluindo subdomínios)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Restringe acesso a features do browser desnecessárias
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
]

const nextConfig: NextConfig = {
  transpilePackages: ["@hookform/resolvers"],
  // Improve production error messages
  productionBrowserSourceMaps: false,
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // Security headers aplicados em todas as rotas
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
  experimental: {
    // Increase body size limit for Server Actions (for file uploads)
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
