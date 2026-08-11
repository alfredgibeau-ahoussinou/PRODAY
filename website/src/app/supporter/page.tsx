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
  title: "Pôle Supporter · Tribune gratuite",
  description:
    "Scores live, suivis illimités, débats et moments. 100 % gratuit. Pas de paywall.",
};

export default function SupporterPage() {
  const visuals = getRoleVisuals("supporter");
  const accentStyle = poleAccentCssVars("supporter");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Supporter"
        headline="La tribune. Point."
        support="Scores, suivis, débats. Zéro abonnement. Tu viens pour le match : pas pour un outil pro."
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
