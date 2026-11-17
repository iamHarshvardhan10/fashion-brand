import type { NextConfig } from "next";

// Express API. The browser calls /api/* on this origin and Next forwards it, so the
// session cookie is first-party and no CORS is needed.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:9000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
