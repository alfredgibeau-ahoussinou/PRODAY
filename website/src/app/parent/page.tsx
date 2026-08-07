import type { Metadata } from "next";
import { TerminalProductPage } from "@/components/terminal";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Espace Parent",
  description:
    "Supervision, contacts approuvés et limites de temps pour les comptes mineurs sur ProDay.",
};

export default function ParentPortalPage() {
  return (
    <TerminalProductPage
      pathname={ROUTES.parent}
      visualId="parent"
      kicker="Famille · Sécurité"
      title="Espace Parent"
      description="Supervision, contacts approuvés et limites de temps. Pour accompagner un mineur sans étouffer le jeu."
      story={{
        title: "Voir sans envahir.",
        body: "L'espace Parent donne un cadre clair : qui peut contacter, combien de temps, quelles alertes. Branché au Pôle Confiance et au profil joueur.",
      }}
      breakdownTitle="Décomposer l'espace Parent"
      features={[
        {
          eyebrow: "Supervision",
          title: "Vue famille",
          body: "Suivre le parcours du mineur : matchs, trajets, messages entrants.",
        },
        {
          eyebrow: "Contacts",
          title: "Liste approuvée",
          body: "Valider coachs, staff et clubs avant la messagerie complète.",
        },
        {
          eyebrow: "Temps",
          title: "Limites d'usage",
          body: "Cadre horaire et rappels. Le foot reste le centre, pas l'écran.",
        },
        {
          eyebrow: "Confiance",
          title: "Lié aux badges",
          body: "S'appuie sur la vérification staff et le badge joueur.",
          href: ROUTES.trust,
          linkLabel: "Voir Confiance",
        },
      ]}
      platformTitle="Un cadre. Plusieurs leviers."
      platformDescription="Sécurité sans friction inutile."
      modules={[
        {
          id: "vue",
          label: "Vue",
          title: "Tableau famille",
          body: "Activité récente, convocations et trajets liés au profil mineur.",
        },
        {
          id: "approbation",
          label: "Approbation",
          title: "Contacts et demandes",
          body: "Accepter ou refuser avant qu'une conversation s'ouvre.",
        },
        {
          id: "limites",
          label: "Limites",
          title: "Temps et notifications",
          body: "Réglages simples. Modifiables quand le niveau change.",
        },
        {
          id: "aide",
          label: "Aide",
          title: "Support ProDay",
          body: "Questions sensibles via la liste d'attente et le pôle Confiance.",
        },
      ]}
      value={{
        title: "La famille dans l'OS du foot.",
        pillars: [
          {
            metric: "1",
            metricLabel: "espace",
            title: "Clarté",
            body: "Pas cinq apps parent. Un cadre dans ProDay.",
          },
          {
            metric: "0",
            metricLabel: "surprise",
            title: "Contacts filtrés",
            body: "Les demandes passent avant le message.",
          },
          {
            metric: "β",
            metricLabel: "bêta",
            title: "Ouvert",
            body: "Rejoindre la liste pour tester le cadre famille.",
          },
        ],
      }}
      cta={{
        title: "Rejoindre l'espace Parent",
        description: "Liste d'attente. Cadre confiance dès l'ouverture.",
        primaryHref: ROUTES.betaWaitlist,
        primaryLabel: "Liste d'attente",
        secondaryHref: ROUTES.trust,
        secondaryLabel: "Pôle Confiance",
      }}
    />
  );
}
