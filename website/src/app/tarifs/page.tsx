import type { Metadata } from "next";
import { PricingTable } from "@/components/interactive/PricingTable";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Offres Gratuit et Pro — Joueur Plus, Coach Pro, Club Pro, Agent Elite.",
};

export default function PricingPage() {
  return (
    <>
      <PageHeader
        kicker="TARIFS"
        title="Gratuit pour démarrer. Pro pour aller plus loin."
        description="Chaque rôle a son plan — limites claires en gratuit, puissance débloquée en Pro."
      />
      <section className="py-16">
        <PricingTable />
      </section>
    </>
  );
}
