import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
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
