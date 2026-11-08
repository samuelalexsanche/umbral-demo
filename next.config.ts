import type { NextConfig } from "next";

// Sitio estático. En GitHub Pages vive bajo /umbral-demo; con dominio propio BASE_PATH va vacío.
export const BASE_PATH = process.env.BASE_PATH ?? "/umbral-demo";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
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
