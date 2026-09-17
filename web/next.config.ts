import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@react-pdf/renderer"],
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      { source: "/standard", destination: "/onboarding/standard", permanent: false },
      { source: "/zero-state", destination: "/onboarding/zero-state", permanent: false },
      { source: "/operations", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
