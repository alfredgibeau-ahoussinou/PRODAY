import type { Metadata, Viewport } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

/** Bump when favicon/PWA icons change (cache navigateurs agressif). */
const ICON_VERSION = "20260826-official";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "ProDay",
      "applicationCategory": "SportsApplication",
      "operatingSystem": "iOS, Android, Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
      },
      "description":
        "L'infrastructure numérique du football amateur et pro. Gestion d'équipe, convocations, stats, carnet médical, carpooling et sponsoring.",
      "url": "https://proday75.fr",
    },
    {
      "@type": "SportsOrganization",
      "name": "ProDay",
      "url": "https://proday75.fr",
      "logo": "https://proday75.fr/branding/logo-proday-official.png",
      "sameAs": [
        "https://www.instagram.com/proday_off",
        "https://tiktok.com/@proday_off",
      ],
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://proday75.fr",
  ),
  title: {
    default: "ProDay · L'infrastructure de votre football",
    template: "%s · ProDay",
  },
  description:
    "Pas un outil de plus. Joueurs, clubs, coachs, parents, supporters et sponsors autour de la même donnée football. Bêta ouverte.",
  keywords: [
    "foot",
    "football",
    "app",
    "joueur",
    "coach",
    "club",
    "sponsor",
    "supporter",
    "matchs",
    "convocations",
  ],
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
      { url: `/favicon.ico?v=${ICON_VERSION}`, sizes: "any" },
      { url: `/icon.png?v=${ICON_VERSION}`, sizes: "192x192", type: "image/png" },
      { url: `/icons/icon-192.png?v=${ICON_VERSION}`, sizes: "192x192", type: "image/png" },
      { url: `/icons/icon-512.png?v=${ICON_VERSION}`, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: `/apple-icon.png?v=${ICON_VERSION}`, sizes: "180x180", type: "image/png" }],
    shortcut: [`/favicon.ico?v=${ICON_VERSION}`],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://proday75.fr",
    title: "ProDay · L'infrastructure de votre football",
    description:
      "Objets métier du football reliés : joueurs, clubs, matchs, convocations, stats, sponsors. Pas Notion. Pas Discord.",
    siteName: "ProDay",
    images: [
      {
        url: "/branding/logo-proday-official.png",
        width: 637,
        height: 172,
        alt: "ProDay",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProDay · L'infrastructure de votre football",
    description:
      "Objets métier du football reliés : joueurs, clubs, matchs, convocations, stats, sponsors. Pas Notion. Pas Discord.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
