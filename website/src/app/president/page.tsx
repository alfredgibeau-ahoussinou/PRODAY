import type { Metadata } from "next";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { PresidentAppHub } from "@/components/poles/PresidentAppHub";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { CLUB_APP_HREF, ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Président · Cockpit dirigeants",
  description:
    "Le président ouvre ProDay et comprend le club en quelques secondes. Cockpit, finances, assistant IA — décisions claires.",
};

export default function PresidentPolePage() {
  const visuals = getRoleVisuals("pro_club");
  const accentStyle = poleAccentCssVars("president");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Président"
        headline="Le club en un coup d’œil."
        support="Cockpit, finances et assistant IA. Dirigeants, DS et bureau décident depuis ProDay."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta"
        secondaryHref="#app"
        secondaryLabel="Voir l’app Président"
      />

      <PresidentAppHub />

      <TerminalCta
        title="Décider sans perdre le fil."
        description="Cockpit dirigeants, alertes et priorités — dans la même app que le club et les coachs."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Liste d’attente"
        secondaryHref={CLUB_APP_HREF}
        secondaryLabel="Découvrir le Pôle Club"
      />
    </TerminalPage>
  );
}
