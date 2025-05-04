import type { NextConfig } from "next";
import { version } from "./package.json";
const nextConfig: NextConfig = {
  env: {
    version
  },
  /* config options here */
  experimental: {
    useCache: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

};

export default nextConfig;
