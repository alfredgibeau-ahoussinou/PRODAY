import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://proday.app"),
  title: {
    default: "ProDay — Connecter · Progresser · Réussir",
    template: "%s · ProDay",
  },
  description:
    "Plateforme foot amateur et semi-pro : Mercato, Matchs, Arena, Reels, Fil, espace partenaires et Pulse ProDay.",
  openGraph: {
    title: "ProDay",
    description:
      "Une saison. Une app. Recrutement, matchs, tournois, communauté et partenaires.",
    images: ["/branding/logo-light.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${syne.variable} scroll-smooth`}>
      <body className="min-h-screen antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
