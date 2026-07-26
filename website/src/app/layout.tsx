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
    default: "ProDay · L'app pour le foot · Connecter · Progresser · Réussir",
    template: "%s · ProDay",
  },
  description:
    "ProDay, l'app pour le foot. Ton profil, tes matchs, ton club. Tout au même endroit. Que tu sois joueur, coach, club ou supporter, ProDay t'accompagne.",
  keywords: ["foot", "football", "app", "application", "joueur", "coach", "club", "supporter", "matchs", "profil", "équipe"],
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
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
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
    title: "ProDay · L'app pour le foot",
    description:
      "ProDay, l'app pour le foot. Ton profil, tes matchs, ton club. Tout au même endroit.",
    siteName: "ProDay",
    images: [
      {
        url: "/branding/logo-proday-official.png",
        width: 1200,
        height: 630,
        alt: "ProDay - L'app pour le foot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProDay · L'app pour le foot",
    description:
      "ProDay, l'app pour le foot. Ton profil, tes matchs, ton club. Tout au même endroit.",
    images: ["/branding/logo-proday-official.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification",
  },
  other: {
    copyright: "© ProDay 2026 · Tous droits réservés",
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
    <html lang="fr" className={`${inter.variable} ${syne.variable} ${cormorant.variable} scroll-smooth`}>
      <body className="min-h-screen antialiased pt-16">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
        >
          Aller au contenu principal
        </a>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
