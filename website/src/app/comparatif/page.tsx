import type { Metadata } from "next";
import { ComparisonTable } from "@/components/interactive/ComparisonTable";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Comparatif",
  description: "ProDay vs WhatsApp vs tableur. Pourquoi une seule app pour votre saison.",
};

export default function ComparePage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.compare}
        kicker="COMPARATIF"
        title="Pourquoi pas WhatsApp ?"
        description="Groupes dispersés, stats absentes, recrutement flou. ProDay regroupe l'essentiel."
        image="/showcase/classic-exp-team.jpg"
        dark
      />
      <PageBody>
        <div className="mx-auto max-w-4xl">
          <ComparisonTable />
          <p className="mt-8 text-center text-sm text-white/40">
            Complet · Partiel · Absent
          </p>
        </div>
      </PageBody>
    </>
  );
}
