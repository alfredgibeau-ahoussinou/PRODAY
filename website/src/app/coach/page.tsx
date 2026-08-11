import type { Metadata } from "next";
import { RoleAccentStage } from "@/components/immersive/RoleAccentStage";
import {
  CoachCapabilityStrip,
  CoachTacticsBoard,
  ImmersivePoleHero,
} from "@/components/poles/immersivePoleExperience";
import { FormAnalysisFeature } from "@/components/poles/FormAnalysisFeature";
import { RosterBourseSection } from "@/components/poles/RosterBourseSection";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Coach · Tactique IA et analyse de forme",
  description:
    "Profil coach : analyse de forme de l’effectif, Tactique IA, bourse interne, IA et préparation match.",
};

const COACH_CAPS = [
  {
    title: "Analyse de forme",
    body: "Vision complète de l’effectif : forme, charge, récupération déclarée, disponibilité et alertes avant match. Pas de diagnostic médical.",
  },
  {
    title: "Profil et parcours",
    body: "Présentation, diplômes, certifications, clubs entraînés et philosophie de jeu.",
  },
  {
    title: "Effectif et bourse",
    body: "Poste manquant ? Déclarez le besoin, scannez le vivier (équipe B, réserve, catégorie voisine), proposez une montée. Le club valide.",
  },
  {
    title: "Tactique IA",
    body: "Tableau interactif, formations illimitées, banc, consignes et plans de jeu.",
  },
  {
    title: "Invitations de match",
    body: "Proposez un amical pour votre équipe : club adverse, date, lieu. Contre-propositions et calendriers synchronisés.",
  },
  {
    title: "Coaching à l’heure",
    body: "Ouvrez vos créneaux, fixez votre tarif, recevez des demandes. Paiement à la séance, comptes rendus inclus.",
  },
  {
    title: "Match et adversaires",
    body: "Préparation, analyse adversaire, rapports IA et débriefs automatiques.",
  },
  {
    title: "Vidéo multi-caméras",
    body: "Smartphone, tablette, Veo, Trace, Pixellot, Spiideo : jamais obligatoires.",
  },
  {
    title: "Entraînements IA",
    body: "Collectifs et individuels adaptés à l’analyse de forme (intensité / récupération).",
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
        support="Analyse de forme de l’effectif, Tactique IA et bourse interne. Sous Tout inclus, les coachs ne paient rien."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre le Pôle Coach"
        secondaryHref="#analyse-de-forme"
        secondaryLabel="Analyse de forme"
      />

      <FormAnalysisFeature audience="coach" />

      <CoachTacticsBoard />

      <RosterBourseSection audience="coach" />

      <RoleAccentStage
        role="coach"
        kicker="Tactique IA"
        title="Composer. Décider. Gagner."
      />

      <CoachCapabilityStrip items={COACH_CAPS} />

      <TerminalCta
        title="Le coach, moteur du club."
        description="Effectif, analyse de forme et board tactique : dans la même app que vos licenciés."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Commencer côté Coach"
        secondaryHref={`${ROUTES.proClub}#analyse-de-forme`}
        secondaryLabel="Analyse de forme côté Club"
      />
    </TerminalPage>
  );
}
