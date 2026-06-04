import type { Metadata } from "next";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Quiz profil",
  description: "3 questions pour découvrir votre parcours ProDay idéal.",
};

export default function QuizPage() {
  return (
    <>
      <PageHeader
        kicker="QUIZ"
        title="Quel profil ProDay êtes-vous ?"
        description="Répondez à 3 questions — nous vous orientons vers le bon parcours."
      />
      <section className="py-16">
        <RoleQuiz />
      </section>
    </>
  );
}
