import type { Metadata } from "next";
import { RoleAccentStage } from "@/components/immersive/RoleAccentStage";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
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
  title: "Pôle Sponsor · Visibilité mesurée",
  description:
    "Sponsoring possible sur ProDay. Découverte, Territorial, National Pro. Sans engagement. Offres géolocalisées, ROI et contact clubs.",
};

export default function SponsorPolePage() {
  const visuals = getRoleVisuals("sponsor");
  const accentStyle = poleAccentCssVars("sponsor");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Sponsor"
        headline={SPONSOR_HERO.title}
        support="Sponsoring possible dès la formule Découverte (gratuite). Sans engagement. Offres locales, dashboard ROI, messagerie directe."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.sponsorDevis}
        primaryLabel="Demander un devis"
        secondaryHref={`${ROUTES.pricing}#sponsor`}
        secondaryLabel="Voir les formules"
      />

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
