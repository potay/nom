import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  env: {
    APP_VERSION: require("./package.json").version,
    BUILD_SHA: process.env.COMMIT_SHA?.slice(0, 7) || "dev",
  },
  headers: async () => [
    {
      // Force browsers to always revalidate the service worker file
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
};

export default nextConfig;
