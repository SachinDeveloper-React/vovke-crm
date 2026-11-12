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

  /**
   * The PWA files skip `src/proxy.ts` (see its matcher), so they get their
   * headers here. The worker must never be cached by HTTP — that is how a
   * new build's worker reaches the browser — and the offline page carries
   * its own CSP: it is static HTML with an inline stylesheet and no script.
   */
  async headers() {
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    return [
      {
        source: "/sw.js",
        headers: [
          ...base,
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          // `connect-src https:` is the worker fetching the media library's
          // photos to cache them — the same https images the page's own
          // `img-src` already allows. Nothing else in the worker leaves 'self'.
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'; connect-src 'self' https:" },
        ],
      },
      {
        source: "/offline.html",
        headers: [
          ...base,
          { key: "Cache-Control", value: "no-cache" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; frame-ancestors 'none'",
          },
        ],
      },
      {
        // Not content-hashed, so a week rather than forever.
        source: "/icons/:path*",
        headers: [...base, { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
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
    /**
     * Keeps `next build` from stopping on a security advisory the way 16.4.0
     * did: `next upgrade --agent=security` sets this as part of the upgrade
     * it performs, so a future advisory is taken by the same tool rather
     * than by a build that refuses halfway and has to be run twice.
     */
    agentUpgrade: "security",
    serverActions: {
      // The food library arrives as a spreadsheet, and a Server Action's
      // body is capped at 1 MB by default — a `.xlsx` with a few thousand
      // rows goes past that. 12 MB leaves room above the 10 MB the reader
      // accepts (`MAX_SHEET_BYTES`) for multipart boundaries and headers,
      // so the refusal an operator sees is the reader's sentence about
      // their file rather than a framework error about a body size.
      bodySizeLimit: '12mb',
    },
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
