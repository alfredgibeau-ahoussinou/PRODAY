import type { Metadata } from "next";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { PolesPricingLayout } from "@/components/pricing/PolesPricingLayout";
import { CommercialBadges } from "@/components/pricing/CommercialBadges";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import {
  NO_COMMITMENT_INTRO,
  POLE_REFERRAL_LINE,
} from "@/lib/commercialCopy";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Tarifs ProDay",
  description:
    "Tarifs sans engagement. Sponsoring possible. Mensuel ou annuel −20 %. Parrainage possible. Joueur, Club, Coach, Parent, Supporter, Sponsor.",
};

export default function PricingPage() {
  const visuals = getRoleVisuals("tarifs");

  return (
    <TerminalPage>
      <ImmersivePoleHero
        brand="Pro Day Tarifs"
        headline="Un pôle. Un prix."
        support={`${NO_COMMITMENT_INTRO} Mensuel ou annuel (moins 20 %). Sponsoring possible.`}
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Liste d’attente"
        secondaryHref="#joueur"
        secondaryLabel="Voir les pôles"
        perk={POLE_REFERRAL_LINE}
      />

      <div className="border-y border-white/10 bg-[#08080a] py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <CommercialBadges size="lg" align="center" showDescriptions />
        </div>
      </div>

      <PolesPricingLayout />

      <TerminalCta
        title="La bêta est ouverte."
        description={`${NO_COMMITMENT_INTRO} Sponsoring possible pour les marques. ${POLE_REFERRAL_LINE}`}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta"
        secondaryHref={ROUTES.sponsor}
        secondaryLabel="Espace sponsor"
      />
    </TerminalPage>
  );
}

