import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native / worker-based document-processing packages out of the bundle so
  // they load from node_modules at runtime. Bundling pdfjs-dist (via pdf-parse)
  // breaks its worker resolution ("Cannot find module pdf.worker.mjs"); canvas
  // is a native addon. These run only in server routes.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
