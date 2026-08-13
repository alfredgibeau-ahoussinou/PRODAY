import type { Metadata } from "next";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Vous êtes ?",
  description:
    "Choisissez votre rôle pour accéder au bon pôle ProDay : Joueur, Supporter, Club, Coach, Sponsor ou Organisateur.",
};

export default function QuizPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.quiz}
        kicker="RÔLE"
        title="Vous êtes ?"
        description="Un clic pour rejoindre le pôle qui vous correspond."
        image="/showcase/classic-exp-discover.jpg"
        dark
      />
      <PremiumSection
        kicker="PÔLES"
        title="Choisissez votre rôle"
        description="Joueur, Supporter, Club, Coach, Sponsor ou Organisateur."
        bordered={false}
      >
        <RoleQuiz />
      </PremiumSection>
    </>
  );
}
