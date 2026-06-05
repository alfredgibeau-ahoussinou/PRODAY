import type { Metadata } from "next";
import { PricingTable } from "@/components/interactive/PricingTable";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Offres Gratuit et Pro — par univers Man, Woman et Pro Day Pro.",
};

export default function PricingPage() {
  return (
    <>
      <PageHeader
        kicker="TARIFS"
        title="Gratuit pour démarrer. Pro pour aller plus loin."
        description="Choisissez votre univers — Man, Woman ou Pro — puis le plan adapté à votre rôle."
      />
      <section className="py-16">
        <PricingTable />
      </section>
    </>
  );
}
