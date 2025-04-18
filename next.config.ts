import type { NextConfig } from "next";
const { version } = require("./package.json")
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
