import type { Metadata } from "next";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Quiz profil",
  description: "3 questions pour trouver votre pôle. Joueur, Pro, Santé ou Partenaires.",
};

export default function QuizPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.quiz}
        kicker="QUIZ"
        title="Quel pôle ProDay vous correspond ?"
        description="3 questions. On vous oriente vers le bon pôle : Joueur, Pro, Santé ou Partenaires."
        image="/showcase/classic-exp-discover.jpg"
        dark
      />
      <PremiumSection
        kicker="4 PÔLES"
        title="Joueur · Pro · Santé · Partenaires"
        description="Le quiz oriente vers le bon pôle : Joueur, Pro, Santé ou Partenaires."
        bordered={false}
      >
        <RoleQuiz />
      </PremiumSection>
    </>
  );
}
