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
    "Mercato, Reels, Fil, Arena, covoiturage, pôle santé, espace sponsor, Shop, Visibilité, CV vivant et Live Stats. Organisés par 7 pôles.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.features}
        kicker="FONCTIONNALITÉS"
        title="Ce que fait ProDay"
        description="12 piliers produit. Recrutement, communauté, partenaires, tournois et confiance."
        image="/showcase/classic-mercato.jpg"
        dark
      />

      <PremiumSection
        id="poles"
        kicker="4 PÔLES"
        title="Le bon module, le bon pôle"
        description="Chaque module s'adapte au pôle Joueur, Pro, Santé ou Partenaires. Sans mélanger les publics."
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
        title="Vérification staff et mineurs"
        description="Vérification staff, contrôle parental et espace famille. Détail sur la page Confiance."
      >
        <VerificationTimeline embedded />
      </PremiumSection>
    </>
  );
}
