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
      // Legacy → Pôle Joueur unifié
      { source: "/joueurs", destination: "/joueur", permanent: true },
      { source: "/joueurs/:path*", destination: "/joueur", permanent: true },
      { source: "/amateur", destination: "/joueur", permanent: true },
      { source: "/amateur/:path*", destination: "/joueur", permanent: true },
      { source: "/pro-joueur", destination: "/joueur", permanent: true },
      { source: "/pro-joueur/:path*", destination: "/joueur", permanent: true },
      { source: "/player", destination: "/joueur", permanent: true },
      { source: "/players", destination: "/joueur", permanent: true },
      { source: "/man", destination: "/joueur", permanent: true },
      { source: "/homme", destination: "/joueur", permanent: true },
      { source: "/homme/:path*", destination: "/joueur", permanent: true },
      { source: "/woman", destination: "/joueur", permanent: true },
      { source: "/woman/:path*", destination: "/joueur", permanent: true },
      { source: "/partenaires", destination: "/sponsor", permanent: true },
      // Rôle Santé retiré de la vitrine
      { source: "/sante", destination: "/joueur", permanent: true },
      { source: "/sante/:path*", destination: "/joueur", permanent: true },
    ];
  },
};

export default nextConfig;
