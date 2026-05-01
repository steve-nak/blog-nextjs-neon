import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: r2PublicUrl
    ? {
        remotePatterns: [
          {
            protocol: r2PublicUrl.protocol.replace(":", "") as "http" | "https",
            hostname: r2PublicUrl.hostname,
            pathname: `${r2PublicUrl.pathname.replace(/\/$/, "") || ""}/**`,
          },
        ],
      }
    : undefined,
};

export default nextConfig;
