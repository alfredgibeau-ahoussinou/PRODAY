import type { Metadata } from "next";
import { RoleAccentStage } from "@/components/immersive/RoleAccentStage";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import {
  JoueurBadgePlayground,
  JoueurFreeVsPass,
  JoueurWarmCta,
  JoueurWeekStory,
} from "@/components/poles/joueurImmersive";
import { TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Joueur · Ton foot, sans prise de tête",
  description:
    "Profil, convocations, covoiturage et stats. Gratuit pour jouer. Pass 3,99 € si tu veux aller plus loin.",
};

export default function JoueurPolePage() {
  const visuals = getRoleVisuals("joueur");
  const accentStyle = poleAccentCssVars("joueur");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Joueur"
        headline="Ton terrain. Ton rythme."
        support="Pas un outil de bureau. Une app pour jouer, confirmer, covoiturer — et progresser si tu veux."
        poster="/images/football-amateur-01.jpg"
        video={visuals.heroVideo}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Créer mon compte"
        secondaryHref={ROUTES.demo + "?p=joueur"}
        secondaryLabel="Voir la démo"
      />

      <JoueurBadgePlayground />

      <JoueurWeekStory />

      <RoleAccentStage
        role="joueur"
        kicker="Sur le terrain"
        title="Ton match commence ici."
      />

      <JoueurFreeVsPass />

      <JoueurWarmCta />
    </TerminalPage>
  );
}
