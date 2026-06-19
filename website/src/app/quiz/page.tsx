import type { Metadata } from "next";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Quiz profil",
  description: "3 questions pour découvrir votre pôle ProDay idéal — Joueur, Pro, Santé ou Partenaires.",
};

export default function QuizPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.quiz}
        kicker="QUIZ"
        title="Quel pôle ProDay vous correspond ?"
        description="Répondez à 3 questions — nous vous orientons vers le bon pôle parmi Joueur, Pro, Santé et Partenaires."
        dark
      />
      <PremiumSection
        kicker="4 PÔLES"
        title="Joueur · Pro · Santé · Partenaires"
        description="Le quiz analyse votre profil et vous propose le parcours le plus adapté."
        bordered={false}
      >
        <RoleQuiz />
      </PremiumSection>
    </>
  );
}
