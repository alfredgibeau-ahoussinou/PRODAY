import type { Metadata } from "next";
import { RoleAccentStage } from "@/components/immersive/RoleAccentStage";
import {
  ClubOffersInteractive,
  ClubPitchMap,
  ImmersivePoleHero,
} from "@/components/poles/immersivePoleExperience";
import { VideoHardwareOffers } from "@/components/poles/VideoHardwareOffers";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Club · Cœur de ProDay",
  description:
    "Équipes, compétitions, covoiturage. Offres Amateur / Essentiel / Premium + module vidéo optionnel (smartphone ou Pro+Veo).",
};

export default function ProClubPage() {
  const visuals = getRoleVisuals("pro_club");
  const accentStyle = poleAccentCssVars("pro_club");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Club"
        headline="Le club au centre."
        support="Équipes, licenciés, compétitions et covoiturage — avec un module vidéo flexible : smartphone ou pack caméra, jamais obligatoire."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Structurer mon club"
        secondaryHref="#video"
        secondaryLabel="Module vidéo"
      />

      <ClubPitchMap />

      <RoleAccentStage
        role="pro_club"
        kicker="Immersion"
        title="La structure, en volume."
      />

      <ClubOffersInteractive />

      <VideoHardwareOffers />

      <TerminalCta
        title="Faites du club le cockpit."
        description="Quatre formules Club — mensuel ou Pro + Veo. Le matériel reste un choix, jamais une contrainte."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta Club"
        secondaryHref={ROUTES.coach}
        secondaryLabel="Découvrir le Pôle Coach"
      />
    </TerminalPage>
  );
}
