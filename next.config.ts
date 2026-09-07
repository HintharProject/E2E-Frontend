import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  agentRules: false,
  turbopack: {
    resolveAlias: {
      "@clerk/nextjs/server": "./src/lib/clerk-shim-server.ts",
      "@clerk/nextjs": "./src/lib/clerk-shim.tsx",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@clerk/nextjs/server": path.resolve(__dirname, "src/lib/clerk-shim-server.ts"),
      "@clerk/nextjs": path.resolve(__dirname, "src/lib/clerk-shim.tsx"),
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "s3.eu-central-003.backblazeb2.com",
      },
      {
        protocol: "https",
        hostname: "e2e-private.s3.eu-central-003.backblazeb2.com",
      },
    ],
  },
};

export default nextConfig;
