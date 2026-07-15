import type { Metadata } from "next";
import { FeaturesBento } from "@/components/FeaturesBento";
import { ModuleExplorer } from "@/components/ModuleExplorer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { VerificationTimeline } from "@/components/VerificationTimeline";
import { POLES, poleSectionHref } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fonctionnalités",
  description:
    "Mercato, Reels, Fil, Arena, covoiturage, pôle santé, espace partenaires, Shop, Visibilité, CV vivant et Live Stats — organisés par 4 pôles.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.features}
        kicker="FONCTIONNALITÉS"
        title="L'ensemble de votre saison, structuré"
        description="12 piliers produit — recrutement, communauté, partenaires, tournois et confiance intégrée. Organisés par pôle."
        image="/showcase/classic-mercato.jpg"
        dark
      />

      <PremiumSection
        id="poles"
        kicker="4 PÔLES"
        title="Une fonctionnalité, le bon univers"
        description="Chaque module s'adapte au pôle Joueur, Pro, Santé ou Partenaires — sans mélanger les parcours."
        bordered={false}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {POLES.map((pole) => (
            <Link
              key={pole.id}
              href={poleSectionHref(pole)}
              className="card-premium group rounded-2xl p-6 transition hover:border-white/20"
            >
              <p className="text-xs font-semibold tracking-widest text-white/40">{pole.kicker}</p>
              <h3 className="font-display mt-2 text-xl font-bold text-white">{pole.title}</h3>
              <p className="mt-2 text-sm text-white/55">{pole.subtitle}</p>
              <span className="mt-4 inline-block text-sm font-medium text-white/70 transition group-hover:text-white">
                En savoir plus
              </span>
            </Link>
          ))}
        </div>
      </PremiumSection>

      <ModuleExplorer />
      <FeaturesBento extended />
      <PremiumSection
        id="verification"
        kicker="CONFIANCE"
        title="Confiance intégrée"
        description="Vérification staff, contrôle parental et espace famille — détail sur la page dédiée."
      >
        <VerificationTimeline embedded />
      </PremiumSection>
    </>
  );
}
