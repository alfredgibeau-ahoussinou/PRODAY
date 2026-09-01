import type { Metadata } from "next";
import { RoleAccentStage } from "@/components/immersive/RoleAccentStage";
import {
  CoachCapabilityStrip,
  ImmersivePoleHero,
} from "@/components/poles/immersivePoleExperience";
import { CoachAppHub } from "@/components/poles/CoachAppHub";
import { FormAnalysisFeature } from "@/components/poles/FormAnalysisFeature";
import { RosterBourseSection } from "@/components/poles/RosterBourseSection";
import { TacticalChalkboard } from "@/components/tactics/TacticalChalkboard";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { POLE_REFERRAL_LINE } from "@/lib/commercialCopy";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Coach · Tactique IA, Tableau Noir Interactif & Analyse de Forme",
  description:
    "Profil coach : démonstrateur de Tableau Noir Tactique interactif, consignes de jeu en temps réel, analyse de forme de l'effectif et bourse interne. Sans abonnement pour les coachs.",
};

const COACH_CAPS = [
  {
    title: "Tableau Noir Tactique IA",
    body: "Démonstrateur interactif dans le navigateur, bascule de formations en direct, animations de phases (Attaque, Bloc, Contre, Pressing) et consignes individuelles.",
  },
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
    title: "Invitations de match",
    body: "Proposez un amical pour votre équipe : club adverse, date, lieu. contre propositions et calendriers synchronisés.",
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
    title: "Vidéo multi caméras",
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
        headline="Votre banc de touche. Votre tableau noir."
        support="Démonstrateur interactif de tactique et consignes de jeu, analyse de forme de l’effectif et bourse interne. Sous Tout inclus, les coachs ne paient rien."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref="#tactique"
        primaryLabel="Tester le Tableau Noir Tactique"
        secondaryHref="#app"
        secondaryLabel="Voir l’app Coach"
        perk={POLE_REFERRAL_LINE}
      />

      <CoachAppHub />

      <div id="tactique">
        <TacticalChalkboard
          headline="Tableau Noir Tactique IA · Démonstrateur Interactif"
          subtitle="Testez vos schémas tactiques directement dans le navigateur : animez les phases de jeu (Attaque, Bloc Défensif, Contre Éclair, Pressing Haut) et personnalisez les consignes individuelles et collectives."
        />
      </div>

      <FormAnalysisFeature audience="coach" />

      <RosterBourseSection audience="coach" />

      <RoleAccentStage
        role="coach"
        kicker="Tactique IA"
        title="Composer. Décider. Gagner."
      />

      <CoachCapabilityStrip items={COACH_CAPS} />

      <TerminalCta
        title="Le coach, moteur du club."
        description={`Effectif, analyse de forme et board tactique : dans la même app que vos licenciés. ${POLE_REFERRAL_LINE}`}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Commencer côté Coach"
        secondaryHref={`${ROUTES.proClub}#analyse-de-forme`}
        secondaryLabel="Analyse de forme côté Club"
      />
    </TerminalPage>
  );
}
