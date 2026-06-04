import type { Metadata } from "next";
import { VisionGrid } from "@/components/about/VisionGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { BRAND } from "@/lib/content";

export const metadata: Metadata = {
  title: "À propos",
  description: `Mission ProDay : ${BRAND.tagline} — écosystème foot amateur et semi-pro.`,
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        kicker="À PROPOS"
        title="Connecter · Progresser · Réussir"
        description={BRAND.mission}
      />
      <VisionGrid />
      <MarqueeStrip />
    </>
  );
}
