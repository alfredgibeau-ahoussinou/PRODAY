import type { Metadata } from "next";
import {
  ClubOffersInteractive,
  ClubPitchMap,
  ImmersivePoleHero,
} from "@/components/poles/immersivePoleExperience";
import { ClubMatchInviteSection } from "@/components/poles/ClubMatchInviteSection";
import { ClubModulesSection } from "@/components/poles/ClubModulesSection";
import { ClubPresidentHub } from "@/components/poles/ClubPresidentHub";
import { VideoHardwareOffers } from "@/components/poles/VideoHardwareOffers";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Club · Cœur de ProDay",
  description:
    "Équipes, bourse de recrutement interne, invitations de match, covoiturage et direction du club. Offres Amateur / Essentiel / Tout inclus.",
};

export default function ProClubPage() {
  const visuals = getRoleVisuals("pro_club");
  const accentStyle = poleAccentCssVars("pro_club");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Club"
        headline="Le club au centre."
        support="Équipes, bourse de recrutement, invitations de match et covoiturage — le QG du foot amateur avant de chercher dehors."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Structurer mon club"
        secondaryHref="#president"
        secondaryLabel="Espace président"
      />

      <ClubPresidentHub />

      <ClubModulesSection />

      <ClubMatchInviteSection />

      <ClubPitchMap />

      <ClubOffersInteractive />

      <VideoHardwareOffers />

      <TerminalCta
        title="Faites du club le cockpit."
        description="Quatre formules Club : mensuel ou Pro + Veo. Le matériel reste un choix, jamais une contrainte."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta Club"
        secondaryHref={ROUTES.coach}
        secondaryLabel="Découvrir le Pôle Coach"
      />
    </TerminalPage>
  );
}
