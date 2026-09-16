import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.reelly.io", pathname: "/**" },
      { protocol: "https", hostname: "reelly-backend.s3.amazonaws.com", pathname: "/**" },
      { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
      { protocol: "https", hostname: "**.cloudfront.net", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "**.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com", pathname: "/**" },
      { protocol: "https", hostname: "**.blob.vercel-storage.com", pathname: "/**" },
    ],
    qualities: [75, 90, 100],
    minimumCacheTTL: 60 * 60 * 24,
  },
};

export default nextConfig;
