import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: an unrelated lockfile above this folder would
  // otherwise be picked up and warned about.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  images: {
    remotePatterns: [
      {
        // Gallery photographs uploaded through /admin, stored in Vercel Blob.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
