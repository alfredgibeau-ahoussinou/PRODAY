import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://proday.app"),
  title: {
    default: "ProDay — Connecter · Progresser · Réussir",
    template: "%s · ProDay",
  },
  description:
    "Plateforme mobile foot amateur et semi-pro : Mercato, Matchs, Arena, Pulse ProDay et CV vivant.",
  openGraph: {
    title: "ProDay",
    description:
      "Une saison. Une app. Recrutement, matchs, tournois et communauté.",
    images: ["/branding/logo-light.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
