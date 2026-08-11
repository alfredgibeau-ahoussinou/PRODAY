import type { Metadata } from "next";
import { VerificationTimeline } from "@/components/VerificationTimeline";
import {
  TerminalCta,
  TerminalFeatureGrid,
  TerminalPage,
  TerminalSection,
  TerminalStory,
  TerminalValue,
} from "@/components/terminal";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleAccentStage } from "@/components/immersive/RoleAccentStage";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Confiance ProDay",
  description:
    "Vérification coach et agent, badge joueur vérifié, confidentialité contacts et contrôle parental.",
};

export default function TrustPage() {
  const visuals = getRoleVisuals("confiance");

  return (
    <TerminalPage>
      <PageHeader
        pathname={ROUTES.trust}
        kicker="Confiance"
        title="Staff certifié. Joueurs vérifiés. Familles rassurées."
        description="Diplômes et licences validés avant messagerie complète. Badge joueur vérifié. Contrôle parental pour les comptes mineurs."
        image={visuals.hero}
        video={visuals.heroVideo}
        dark
      />
      <RoleAccentStage
        role="confiance"
        kicker={visuals.accentKicker}
        title={visuals.accentTitle}
      />
      <TerminalStory
        title="Un cadre avant la conversation."
        body="Vérification staff, badge joueur et espace famille. Moins de bruit. Plus de signal pour le terrain."
        image={visuals.story}
      />
      <TerminalSection
        kicker="Parcours"
        title="Comment ça se vérifie"
        description="Les étapes avant l'accès complet."
        bordered={false}
      >
        <VerificationTimeline fullPage id="verification" />
      </TerminalSection>
      <TerminalFeatureGrid
        title="Trois piliers de confiance"
        features={[
          {
            eyebrow: "Staff",
            title: "Diplômes et licences",
            body: "Validés avant messagerie complète. Coach et agent dans le même cadre.",
          },
          {
            eyebrow: "Joueur",
            title: "Badge vérifié",
            body: "Licence ou certification club. Les recruteurs filtrent par poste, catégorie et zone : pas par badge de prestige.",
            href: ROUTES.joueur,
            linkLabel: "Pôle Joueur",
          },
          {
            eyebrow: "Famille",
            title: "Espace Parent",
            body: "Contacts approuvés et limites de temps pour les comptes mineurs.",
            href: ROUTES.parent,
            linkLabel: "Espace Parent",
          },
          {
            eyebrow: "Contacts",
            title: "Confidentialité",
            body: "Qui voit téléphone et email. Demandes agent en accept / refuse.",
          },
        ]}
      />
      <TerminalValue
        title="La confiance, dans l'OS."
        pillars={[
          {
            metric: "1",
            metricLabel: "cadre",
            title: "Staff",
            body: "Validation avant conversation.",
          },
          {
            metric: "1",
            metricLabel: "badge",
            title: "Joueur",
            body: "Licence ou club. Visible, pas exposant.",
          },
          {
            metric: "1",
            metricLabel: "espace",
            title: "Parent",
            body: "Supervision sans étouffer le jeu.",
          },
        ]}
      />
      <TerminalCta
        title="Prêt pour un cadre de confiance ?"
        description="Liste d'attente ouverte."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="S'inscrire"
        secondaryHref={ROUTES.parent}
        secondaryLabel="Espace Parent"
      />
    </TerminalPage>
  );
}
