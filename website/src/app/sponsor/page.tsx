import type { Metadata } from "next";
import { RoleAccentStage } from "@/components/immersive/RoleAccentStage";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { SponsorAppHub } from "@/components/poles/SponsorAppHub";
import {
  SponsorCapabilityPlay,
  SponsorTiersCompare,
  SponsorWarmCta,
} from "@/components/poles/sponsorImmersive";
import { TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";
import { SPONSOR_HERO } from "@/lib/sponsorContent";

export const metadata: Metadata = {
  title: "Pôle Sponsor · Opportunités & impact",
  description:
    "Trouver des opportunités de sponsoring, identifier clubs et profils, gérer partenariats, suivre activations, mesurer visibilité et impact. Sans engagement.",
};

export default function SponsorPolePage() {
  const visuals = getRoleVisuals("sponsor");
  const accentStyle = poleAccentCssVars("sponsor");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Sponsor"
        headline={SPONSOR_HERO.title}
        support="Opportunités, clubs et profils pertinents, partenariats, activations, visibilité et impact. Porte d'entrée vers le même écosystème — dès la formule Découverte."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.sponsorDevis}
        primaryLabel="Demander un devis"
        secondaryHref="#app"
        secondaryLabel="Voir l’app Sponsor"
      />

      <SponsorAppHub />

      <SponsorCapabilityPlay />

      <RoleAccentStage
        role="sponsor"
        kicker="Marque"
        title="Visibilité mesurée."
      />

      <SponsorTiersCompare />

      <SponsorWarmCta />
    </TerminalPage>
  );
}
