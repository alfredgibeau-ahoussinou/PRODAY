import type { Metadata } from "next";
import { VisionGrid } from "@/components/about/VisionGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { BRAND } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "À propos",
  description: `Mission ProDay : ${BRAND.tagline} — écosystème foot amateur et semi-pro.`,
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.about}
        kicker="À PROPOS"
        title="Connecter · Progresser · Réussir"
        description={BRAND.mission}
        dark
      />
      <VisionGrid />
      <MarqueeStrip />
    </>
  );
}
