import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build standalone para imagen Docker mínima — Next copia solo lo necesario
  // a .next/standalone/, sin node_modules completos.
  output: 'standalone',
};

export default nextConfig;
