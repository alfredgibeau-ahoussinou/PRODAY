import type { Metadata } from "next";
import { ComparisonTable } from "@/components/interactive/ComparisonTable";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Comparatif",
  description: "ProDay vs WhatsApp vs tableur — pourquoi une seule app pour votre saison.",
};

export default function ComparePage() {
  return (
    <>
      <PageHeader
        kicker="COMPARATIF"
        title="Pourquoi pas WhatsApp ?"
        description="Groupes éparpillés, pas de stats structurées, pas de recrutement ciblé — ProDay unifie tout."
      />
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ComparisonTable />
          <p className="mt-8 text-center text-sm text-proday-muted">
            ✓ Complet · — Partiel · ✗ Absent
          </p>
        </div>
      </section>
    </>
  );
}
