import path from "node:path";

import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  reactStrictMode: true,
  typedRoutes: true,


  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  turbopack: {
    // This app sits inside a repository whose root is a React Native project.
    // Without this, Turbopack walks up to that root and reads its lockfile.
    root: path.resolve(import.meta.dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "@mui/system",
      "@mui/x-data-grid",
      "@mui/x-data-grid-pro",
      "@mui/x-date-pickers",
      "@mui/x-tree-view",
      "@mui/x-chat",
      "framer-motion",
      "dayjs",
    ],
  },
  logging: {
    browserToTerminal: true,
    fetches: { fullUrl: true, hmrRefreshes: true },
    incomingRequests: true,
  },

};

export default nextConfig;
