import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Diretrizes Globais de Performance Web (31 Regras) */
  compress: true, // Regra 09: Compressão ativa no servidor
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Regra 02: Imagens em formatos modernos
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Regra 11: Tree-shaking de pacotes de ícones e animações
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // Regra 27: Cache de estáticos imutável no navegador para fontes auto-hospedadas
        source: "/fonts/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
