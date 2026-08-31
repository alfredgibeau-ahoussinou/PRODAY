import type { MetadataRoute } from "next";

/** Aligné sur layout.tsx — invalide le cache PWA après changement d’icône. */
const ICON_VERSION = "20260825-lockup";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProDay",
    short_name: "ProDay",
    description:
      "Plateforme foot amateur et semi pro : Mercato, Matchs, Arène, Reels et communauté.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#030303",
    theme_color: "#030303",
    lang: "fr",
    icons: [
      {
        src: `/icons/icon-192.png?v=${ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icons/icon-512.png?v=${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icons/icon-512-maskable.png?v=${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
