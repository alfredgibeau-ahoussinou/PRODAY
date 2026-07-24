import type { Metadata } from "next";
import { JourneyRoles } from "@/components/JourneyRoles";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Parcours par rôle",
  description:
    "Joueur, recruteur, santé, organisateur ou parent. Votre chemin dans ProDay, par pôle.",
};

export default function JourneysPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.journeys}
        kicker="PARCOURS"
        title="Chaque rôle, un chemin clair"
        description="Des parcours par pôle. De l'inscription au CV PDF, au tournoi Arena ou aux partenaires."
        image="/images/football-team-01.jpg"
        dark
      />
      <JourneyRoles fullPage />
    </>
  );
}
