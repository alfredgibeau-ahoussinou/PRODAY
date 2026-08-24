import type { Metadata } from "next";
import {
  ClubOffersInteractive,
  ClubPitchMap,
  ImmersivePoleHero,
} from "@/components/poles/immersivePoleExperience";
import { ClubMatchInviteSection } from "@/components/poles/ClubMatchInviteSection";
import { ClubModulesSection } from "@/components/poles/ClubModulesSection";
import { ClubPresidentHub } from "@/components/poles/ClubPresidentHub";
import { RosterBourseSection } from "@/components/poles/RosterBourseSection";
import { FormAnalysisFeature } from "@/components/poles/FormAnalysisFeature";
import { VideoHardwareOffers } from "@/components/poles/VideoHardwareOffers";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { COACH_APP_HREF, ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Club, Cœur de ProDay",
  description:
    "Équipes, analyse de forme, bourse interne, tournois et covoiturage. À partir de 3 € / adhérent sur devis.",
};

export default function ProClubPage() {
  const visuals = getRoleVisuals("pro_club");
  const accentStyle = poleAccentCssVars("pro_club");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Club"
        headline="Le club au centre."
        support="Équipes, analyse de forme, bourse interne et covoiturage. À partir de 3 € / adhérent."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Structurer mon club"
        secondaryHref="#analyse-de-forme"
        secondaryLabel="Analyse de forme"
      />

      <ClubPresidentHub />

      <FormAnalysisFeature audience="club" />

      <RosterBourseSection audience="club" />

      <ClubModulesSection />

      <ClubMatchInviteSection />

      <ClubPitchMap />

      <ClubOffersInteractive />

      <VideoHardwareOffers />

      <TerminalCta
        title="Faites du club le cockpit."
        description="À partir de 3 € / adhérent sur devis. Analyse de forme, matchs, recrutements et caméra en option."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta Club"
        secondaryHref={COACH_APP_HREF}
        secondaryLabel="Découvrir le Pôle Coach"
      />
    </TerminalPage>
  );
}
