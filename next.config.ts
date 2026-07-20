import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Headroom for Server Action payloads (default is 1MB). PDF papers upload
    // directly to R2 via presigned URLs, so they don't count against this.
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
