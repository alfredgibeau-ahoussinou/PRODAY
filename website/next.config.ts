import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // Monorepo : racine PRODAY, sous-dossier website sur Vercel (Root Directory = website)
  outputFileTracingRoot: monorepoRoot,
  async redirects() {
    return [
      { source: "/joueur", destination: "/joueurs", permanent: true },
      { source: "/joueur/:path*", destination: "/joueurs/:path*", permanent: true },
      { source: "/player", destination: "/joueurs", permanent: true },
      { source: "/players", destination: "/joueurs", permanent: true },
      { source: "/man", destination: "/homme", permanent: true },
    ];
  },
};

export default nextConfig;
