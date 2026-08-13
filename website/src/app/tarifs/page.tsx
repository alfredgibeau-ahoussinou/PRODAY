import type { Metadata } from "next";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { PolesPricingLayout } from "@/components/pricing/PolesPricingLayout";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Tarifs ProDay",
  description:
    "Tarifs sans engagement. Mensuel ou annuel −20 %. Parrainage possible. Joueur, Club, Coach, Parent, Supporter, Sponsor.",
};

export default function PricingPage() {
  const visuals = getRoleVisuals("tarifs");

  return (
    <TerminalPage>
      <ImmersivePoleHero
        brand="Pro Day Tarifs"
        headline="Un pôle. Un prix."
        support="Sans engagement. Mensuel ou annuel (−20 %). Tu ouvres l’espace dont tu as besoin — et le parrainage est possible."
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
        description="Sans engagement. Parrainage possible. Les abonnements store suivent le même modèle."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta"
        secondaryHref={ROUTES.faq}
        secondaryLabel="FAQ tarifs"
      />
    </TerminalPage>
  );
}
