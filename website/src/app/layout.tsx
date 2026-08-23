import type { Metadata, Viewport } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://proday75.fr",
  ),
  title: {
    default: "ProDay · L'OS du foot amateur & semi pro",
    template: "%s · ProDay",
  },
  description:
    "Une app pour connecter joueurs, clubs, coachs et communauté. Matchs, mercato, covoit. Un seul système. Bêta ouverte.",
  keywords: ["foot", "football", "app", "joueur", "coach", "club", "matchs", "mercato"],
  authors: [{ name: "ProDay" }],
  creator: "ProDay",
  publisher: "ProDay",
  applicationName: "ProDay",
  appleWebApp: {
    capable: true,
    title: "ProDay",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://proday75.fr",
    title: "ProDay · L'OS du foot",
    description:
      "Joueurs, clubs, coachs, santé, sponsors. Un système connecté pour le terrain.",
    siteName: "ProDay",
    images: [
      {
        url: "/branding/logo-proday-official.png",
        width: 290,
        height: 152,
        alt: "ProDay",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProDay · L'OS du foot",
    description:
      "Joueurs, clubs, coachs, santé, sponsors. Un système connecté pour le terrain.",
    images: ["/branding/logo-proday-official.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main-content"
          className="bg-accent-gradient sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-white"
        >
          Aller au contenu principal
        </a>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
