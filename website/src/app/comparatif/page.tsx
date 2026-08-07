import type { Metadata } from "next";
import { PoleComparison } from "@/components/PoleComparison";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Comparatif des pôles",
  description:
    "Comparez les fonctionnalités de chaque pôle ProDay : Joueur, Pro, Santé, Partenaires et Supporter.",
};

export default function ComparePage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.compare}
        kicker="COMPARATIF"
        title="Comparez les pôles ProDay"
        description="Joueur, Pro, Santé, Partenaires ou Supporter : trouvez le pôle qui vous correspond."
        image="/showcase/classic-exp-team.jpg"
        dark
      />
      <PageBody>
        <div className="mx-auto max-w-7xl">
          <PoleComparison />
        </div>
      </PageBody>
    </>
  );
}
