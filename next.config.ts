import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Allow question-paper PDF uploads through Server Actions (default is 1MB).
    // Note: Vercel still caps serverless request bodies at ~4.5MB.
    serverActions: { bodySizeLimit: "5mb" },
  },
  images: {
    // Google account profile pictures used in the portal UI.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
