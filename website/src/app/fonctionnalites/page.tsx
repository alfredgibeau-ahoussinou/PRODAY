import type { Metadata } from "next";
import { FeaturesBento } from "@/components/FeaturesBento";
import { ModuleExplorer } from "@/components/ModuleExplorer";
import { PageHeader } from "@/components/layout/PageHeader";
import { VerificationTimeline } from "@/components/VerificationTimeline";

export const metadata: Metadata = {
  title: "Fonctionnalités",
  description:
    "Mercato, covoiturage, pôle santé, ProDay Shop, Arena, Pulse, CV vivant et Live Stats.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        kicker="FONCTIONNALITÉS"
        title="Tout votre foot amateur, une app"
        description="Huit piliers produit pour connecter joueurs, recruteurs et organisateurs — sans groupes éparpillés."
        image="/showcase/classic-mercato.jpg"
        dark
      />
      <ModuleExplorer />
      <FeaturesBento extended />
      <section className="border-t border-neutral-200 bg-neutral-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold">Confiance intégrée</h2>
          <p className="mt-2 max-w-xl text-proday-muted">
            La vérification staff fait partie de l&apos;écosystème — détail sur la
            page dédiée.
          </p>
        </div>
        <VerificationTimeline embedded />
      </section>
    </>
  );
}
