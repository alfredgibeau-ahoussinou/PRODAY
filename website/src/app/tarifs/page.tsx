import type { Metadata } from "next";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { PolesPricingLayout } from "@/components/pricing/PolesPricingLayout";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Tarifs ProDay",
  description:
    "Joueur (Pass 3,99 €), Club Amateur / Essentiel / Premium, Coach, Supporter gratuit, Sponsor. Mensuel ou annuel −20 %.",
};

export default function PricingPage() {
  const visuals = getRoleVisuals("tarifs");

  return (
    <TerminalPage>
      <ImmersivePoleHero
        brand="Pro Day Tarifs"
        headline="Un pôle. Un prix."
        support="Pas de forfait fourre-tout. Tu ouvres l’espace dont tu as besoin — Joueur, Club, Coach, Supporter ou Sponsor."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Liste d’attente"
        secondaryHref="#joueur"
        secondaryLabel="Voir les pôles"
      />

      <PolesPricingLayout />

      <TerminalCta
        title="La bêta est ouverte."
        description="Teste l’app. Les abonnements store suivent le même modèle."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta"
        secondaryHref={ROUTES.faq}
        secondaryLabel="FAQ tarifs"
      />
    </TerminalPage>
  );
}
