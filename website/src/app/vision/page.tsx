import type { Metadata } from "next";
import Link from "next/link";
import { VisionGrid } from "@/components/about/VisionGrid";
import { VisionTodayTomorrow } from "@/components/about/VisionTodayTomorrow";
import { PageCtaBand } from "@/components/layout/PageCtaBand";
import { PageHeader } from "@/components/layout/PageHeader";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { BRAND, PRODUCT_VISION } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Vision",
  description: `${BRAND.name}. ${PRODUCT_VISION.intro}`,
};

export default function VisionPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.vision}
        kicker="VISION"
        title="Aujourd'hui et demain"
        description={PRODUCT_VISION.intro}
        image="/images/football-stadium-night-01.jpg"
        dark
      />
      <VisionTodayTomorrow />
      <VisionGrid />
      <PageCtaBand align="between">
        <div>
          <p className="font-display text-xl font-bold text-white">Transparence produit</p>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            La roadmap détaille le calendrier. Les démos du site sont illustratives. Pas de
            données live ni de métriques d&apos;audience inventées.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <PremiumButton href={ROUTES.roadmap} variant="outline">
            Voir la roadmap
          </PremiumButton>
          <PremiumButton href={ROUTES.betaWaitlist}>Liste d&apos;attente</PremiumButton>
        </div>
      </PageCtaBand>
      <MarqueeStrip />
      <p className="bg-[#030303] pb-12 text-center text-sm text-white/40">
        <Link href={ROUTES.about} className="hover:text-white/70">
          À propos
        </Link>
        {" · "}
        <Link href={ROUTES.faq} className="hover:text-white/70">
          FAQ
        </Link>
      </p>
    </>
  );
}
