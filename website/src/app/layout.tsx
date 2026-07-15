import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Syne } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://proday75.fr",
  ),
  title: {
    default: "ProDay — Connecter · Progresser · Réussir",
    template: "%s · ProDay",
  },
  description:
    "Plateforme foot amateur et semi-pro : Mercato, Matchs, Arena, Reels, Fil, espace partenaires et Visibilité ProDay.",
  applicationName: "ProDay",
  appleWebApp: {
    capable: true,
    title: "ProDay",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "ProDay",
    description:
      "Une saison. Une app. Recrutement, matchs, tournois, communauté et partenaires.",
    images: ["/branding/logo-proday-official.png"],
  },
  other: {
    copyright: "© ProDay 2026 — Tous droits réservés",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${syne.variable} ${cormorant.variable} scroll-smooth`}>
      <body className="min-h-screen antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
