import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
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
