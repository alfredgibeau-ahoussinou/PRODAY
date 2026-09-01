import type { Metadata } from "next";
import { PoleComparison } from "@/components/PoleComparison";
import { CompetitorComparisonGrid } from "@/components/comparatif/CompetitorComparisonGrid";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Comparatif ProDay vs SportEasy, AssoConnect & Excel",
  description:
    "Découvrez pourquoi ProDay est la solution la plus complète du marché : comparatif détaillé avec WhatsApp, Excel, SportEasy et AssoConnect.",
};

export default function ComparePage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.compare}
        kicker="BENCHMARK & INNOVATION"
        title="ProDay vs Les Outils Traditionnels"
        description="Pourquoi continuer à jongler entre 4 applications différentes quand un seul écosystème réunit tout votre club ?"
        image="/showcase/classic-exp-team.jpg"
        dark
      />
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-20 py-8">
          {/* Competitor Comparison */}
          <div>
            <div className="mb-8 text-center sm:text-left">
              <span className="font-mono text-xs uppercase tracking-widest text-[#E8B923]">
                Matrice comparative du marché
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
                ProDay vs WhatsApp, SportEasy & AssoConnect
              </h2>
              <p className="mt-2 text-sm text-white/55 max-w-2xl">
                Comparez les fonctionnalités indispensables pour votre club amateur ou professionnel : IA, vidéo, cotisations, covoiturage et sponsoring.
              </p>
            </div>
            <CompetitorComparisonGrid />
          </div>

          {/* Pole by pole detailed comparison */}
          <div className="border-t border-white/10 pt-16">
            <div className="mb-8 text-center sm:text-left">
              <span className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">
                Fonctionnalités par profil
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
                Matrice détaillée par Pôle ProDay
              </h2>
              <p className="mt-2 text-sm text-white/55 max-w-2xl">
                Joueur, Coach/Club, Partenaires ou Supporter : filtrez par catégorie pour explorer tout ce que vous débloquez.
              </p>
            </div>
            <PoleComparison />
          </div>
        </div>
      </PageBody>
    </>
  );
}

