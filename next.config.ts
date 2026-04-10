import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: true,
});

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
};

export default withSerwist(nextConfig);
