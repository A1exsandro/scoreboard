import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-ignore
    allowedDevOrigins: ["http://192.168.18.8:3000"],
  },
};

export default nextConfig;