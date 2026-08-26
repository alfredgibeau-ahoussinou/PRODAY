import type { Metadata } from "next";
import { RoleAccentStage } from "@/components/immersive/RoleAccentStage";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import {
  SupporterFreeStamp,
  SupporterLiveBoard,
  SupporterTribuneZones,
  SupporterWarmCta,
} from "@/components/poles/supporterImmersive";
import { TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Supporter · Suivre clubs & matchs",
  description:
    "Suivre clubs et joueurs, matchs ProDay et externes, scores, compositions, stats, calendriers, favoris et actualités. Tribune gratuite · même écosystème ProDay.",
};

export default function SupporterPage() {
  const visuals = getRoleVisuals("supporter");
  const accentStyle = poleAccentCssVars("supporter");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Supporter"
        headline="Suivre. Vivre. Le match."
        support="Clubs et joueurs, scores, compositions, statistiques, calendriers, favoris et actualités. Une porte d'entrée vers l'écosystème ProDay, pas un produit à part. Gratuit."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={`${ROUTES.betaWaitlist}?role=supporter`}
        primaryLabel="Entrer dans la tribune"
        secondaryHref={`${ROUTES.demo}?p=supporter`}
        secondaryLabel="Voir la démo"
      />

      <SupporterLiveBoard />

      <SupporterTribuneZones />

      <RoleAccentStage
        role="supporter"
        kicker="Communauté"
        title="La tribune, dans ta poche."
      />

      <SupporterFreeStamp />

      <SupporterWarmCta />
    </TerminalPage>
  );
}
