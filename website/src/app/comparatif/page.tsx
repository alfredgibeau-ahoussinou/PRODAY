import type { Metadata } from "next";
import { ComparisonTable } from "@/components/interactive/ComparisonTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Comparatif",
  description: "ProDay vs WhatsApp vs tableur — pourquoi une seule app pour votre saison.",
};

export default function ComparePage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.compare}
        kicker="COMPARATIF"
        title="Pourquoi pas WhatsApp ?"
        description="Groupes dispersés, statistiques absentes, recrutement non structuré — ProDay centralise l'essentiel."
        dark
      />
      <section className="bg-[#030303] py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ComparisonTable />
          <p className="mt-8 text-center text-sm text-white/40">
            Complet · Partiel · Absent
          </p>
        </div>
      </section>
    </>
  );
}
