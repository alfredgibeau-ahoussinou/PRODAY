import type { Metadata } from "next";
import { JourneyRoles } from "@/components/JourneyRoles";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Parcours par rôle",
  description:
    "Joueur, recruteur, pôle santé, organisateur ou parent — découvrez votre chemin dans ProDay.",
};

export default function JourneysPage() {
  return (
    <>
      <PageHeader
        kicker="PARCOURS"
        title="Chaque rôle, un chemin clair"
        description="Des parcours guidés pour avancer dans l'app — de l'inscription au CV PDF ou au tournoi Arena."
        image="/showcase/classic-profile.jpg"
      />
      <JourneyRoles fullPage />
    </>
  );
}
