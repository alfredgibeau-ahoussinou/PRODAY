import type { NextConfig } from "next";
import path from "path";
import { SECURITY_RESPONSE_HEADERS } from "./src/lib/securityHeaders";

const monorepoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // Monorepo : racine PRODAY, sous-dossier website sur Netlify (Base directory = website)
  outputFileTracingRoot: monorepoRoot,
  // Netlify OpenNext : le handler /_next/image renvoie 502 (lambda status 0).
  // Les assets dans public/ sont servis en statique ; on évite l'optimiseur distant.
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: Object.entries(SECURITY_RESPONSE_HEADERS).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
  async redirects() {
    return [
      { source: "/joueurs", destination: "/amateur", permanent: true },
      { source: "/joueurs/:path*", destination: "/amateur", permanent: true },
      { source: "/joueur", destination: "/pro-joueur", permanent: true },
      { source: "/joueur/:path*", destination: "/pro-joueur", permanent: true },
      { source: "/player", destination: "/pro-joueur", permanent: true },
      { source: "/players", destination: "/pro-joueur", permanent: true },
      { source: "/man", destination: "/amateur", permanent: true },
      { source: "/homme", destination: "/amateur", permanent: true },
      { source: "/homme/:path*", destination: "/amateur", permanent: true },
      { source: "/woman", destination: "/amateur", permanent: true },
      { source: "/woman/:path*", destination: "/amateur", permanent: true },
      { source: "/partenaires", destination: "/sponsor", permanent: true },
    ];
  },
};

export default nextConfig;
