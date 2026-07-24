import type { Metadata } from "next";
import { JourneyRoles } from "@/components/JourneyRoles";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Étapes par rôle",
  description:
    "Joueur, recruteur, santé, organisateur ou parent. Les premières actions dans ProDay, par pôle.",
};

export default function JourneysPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.journeys}
        kicker="PAR RÔLE"
        title="Chaque rôle, un chemin clair"
        description="De l'inscription au CV PDF, au tournoi Arena ou aux offres partenaires. Selon votre pôle."
        image="/images/football-team-01.jpg"
        dark
      />
      <JourneyRoles fullPage />
    </>
  );
}
