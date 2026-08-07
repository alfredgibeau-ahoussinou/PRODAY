import type { Metadata } from "next";
import { RoleAccentStage } from "@/components/immersive/RoleAccentStage";
import {
  CoachCapabilityStrip,
  CoachTacticsBoard,
  ImmersivePoleHero,
} from "@/components/poles/immersivePoleExperience";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { pricingHrefForPole } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Coach · Smart Tactics & effectif",
  description:
    "Profil coach rattaché au club : Smart Tactics, IA, analyse vidéo, convocations et préparation match.",
};

const COACH_CAPS = [
  {
    title: "Profil & parcours",
    body: "Présentation, diplômes, certifications, clubs entraînés et philosophie de jeu.",
  },
  {
    title: "Smart Tactics",
    body: "Tableau interactif, formations illimitées, banc, consignes et plans de jeu.",
  },
  {
    title: "Match & adversaires",
    body: "Préparation, analyse adversaire, rapports IA et débriefs automatiques.",
  },
  {
    title: "Vidéo multi-caméras",
    body: "Smartphone, tablette, Veo, Trace, Pixellot, Spiideo — jamais obligatoires.",
  },
  {
    title: "Entraînements IA",
    body: "Collectifs (échauffement → opposition) et individuels (pied faible, finition, vision…).",
  },
];

export default function CoachPolePage() {
  const visuals = getRoleVisuals("coach");
  const accentStyle = poleAccentCssVars("coach");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Coach"
        headline="Votre banc de touche."
        support="Smart Tactics, effectif et IA — rattaché à un club. Sous Club Premium, les coachs ne paient rien."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre le Pôle Coach"
        secondaryHref={pricingHrefForPole("coach")}
        secondaryLabel="Tarifs Coach"
      />

      <CoachTacticsBoard />

      <RoleAccentStage
        role="coach"
        kicker="Smart Tactics"
        title="Composer. Décider. Gagner."
      />

      <CoachCapabilityStrip items={COACH_CAPS} />

      <TerminalCta
        title="Le coach, moteur du club."
        description="Profil complet, board tactique et analyse — dans la même app que vos licenciés."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Commencer côté Coach"
        secondaryHref={ROUTES.proClub}
        secondaryLabel="Voir le Pôle Club"
      />
    </TerminalPage>
  );
}
