import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/oficinas", destination: "/negocios", permanent: true },
      { source: "/oficinas/:slug", destination: "/negocios/:slug", permanent: true },
      { source: "/dashboard/operador", destination: "/dashboard/mecanico", permanent: false },
      { source: "/dashboard/operador/:path*", destination: "/dashboard/mecanico/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
