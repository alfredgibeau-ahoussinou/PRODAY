import type { Metadata } from "next";
import { TerminalProductPage } from "@/components/terminal";
import { SANTE_BRAND } from "@/lib/content";
import { pricingHrefForPole } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Rôle Santé · Intégré à ProDay",
  description:
    "Kiné, médecin et staff médical : annuaire, agenda et téléconsultation. Rôle intégré — plus un pôle indépendant.",
};

export default function SantePage() {
  return (
    <TerminalProductPage
      pathname={ROUTES.sante}
      visualId="sante"
      accent="sante"
      kicker="RÔLE SANTÉ · INTÉGRÉ"
      title="Soigner près du terrain."
      description={SANTE_BRAND.mission}
      logo={SANTE_BRAND.logo}
      logoAlt={SANTE_BRAND.fullName}
      story={{
        title: "Un rôle dans l’écosystème. Pas un pôle à part.",
        body: "Les praticiens restent sur ProDay pour l’annuaire, l’agenda et la visio — reliés aux joueurs et clubs, sans carousel marketing dédié.",
      }}
      breakdownTitle="Ce que le rôle Santé couvre"
      features={[
        {
          eyebrow: "Annuaire",
          title: "Praticiens vérifiés",
          body: "Visibles des joueurs et clubs de votre zone.",
        },
        {
          eyebrow: "Agenda",
          title: "RDV dans l'app",
          body: "Prise de rendez-vous, rappels et suivi.",
        },
        {
          eyebrow: "Visio",
          title: "Téléconsultation",
          body: "Créneaux 15 / 30 min pour le suivi à distance.",
        },
        {
          eyebrow: "Confidentialité",
          title: "Données protégées",
          body: "Accès médical encadré. Commission uniquement si RDV conclu.",
        },
      ]}
      platformTitle="Branché sur Club et Joueur."
      platformDescription="Les cinq pôles restent Joueur, Club, Coach, Supporter et Sponsor. Santé s’y accroche."
      modules={[
        {
          id: "annuaire",
          label: "Annuaire",
          title: "Près des clubs",
          body: "Spécialité, zone et vérification.",
        },
        {
          id: "agenda",
          label: "Agenda",
          title: "Créneaux ouverts",
          body: "Les joueurs réservent depuis l’app.",
        },
        {
          id: "visio",
          label: "Visio",
          title: "Suivi à distance",
          body: "Téléconsultation intégrée.",
        },
        {
          id: "cabinet",
          label: "Cabinet",
          title: "Profil praticien",
          body: "Messages et mise en avant annuaire (offre Pro).",
        },
      ]}
      value={{
        title: "Santé du foot, sans silo.",
        pillars: [
          {
            metric: "Rôle",
            metricLabel: "intégré",
            title: "Plus un pôle",
            body: "Hors vitrine des 5 pôles principaux.",
          },
          {
            metric: "10 %",
            metricLabel: "si RDV",
            title: "Commission claire",
            body: "Uniquement sur les consultations conclues via ProDay.",
          },
          {
            metric: "Club",
            metricLabel: "proche",
            title: "Territoire",
            body: "Visibilité prioritaire près des structures.",
          },
        ],
      }}
      cta={{
        title: "Rejoindre en tant que praticien",
        description: "Sur invitation. Architecture conservée, positionnement rôle.",
        primaryHref: ROUTES.betaWaitlist,
        primaryLabel: "Demander l’accès",
        secondaryHref: pricingHrefForPole("sante"),
        secondaryLabel: "Tarif Santé Pro",
      }}
    />
  );
}
