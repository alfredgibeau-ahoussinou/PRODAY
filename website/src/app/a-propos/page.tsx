import type { Metadata } from "next";
import Link from "next/link";
import { VisionGrid } from "@/components/about/VisionGrid";
import { VisionTodayTomorrow } from "@/components/about/VisionTodayTomorrow";
import { PageHeader } from "@/components/layout/PageHeader";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { BRAND, PRODUCT_VISION } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "À propos",
  description: `Mission ProDay : ${BRAND.tagline} — ${PRODUCT_VISION.intro}`,
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
      <VisionTodayTomorrow />
      <div className="bg-[#030303] pb-8 text-center">
        <PremiumButton href={ROUTES.vision} variant="outline">
          Vision complète
        </PremiumButton>
        <p className="mt-4 text-sm text-white/40">
          <Link href={ROUTES.roadmap} className="hover:text-white/70">
            Roadmap produit
          </Link>
        </p>
      </div>
      <VisionGrid />
      <MarqueeStrip />
    </>
  );
}
