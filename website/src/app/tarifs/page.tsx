import type { Metadata } from "next";
import Link from "next/link";
import { PricingTable } from "@/components/interactive/PricingTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { SponsorPricingSection } from "@/components/sponsor/SponsorPricingSection";
import { ROUTES } from "@/lib/routes";
import type { ProductLineWeb } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Offres Gratuit et Pro — mensuel au tarif de base, annuel −20 % sur 12 mois. Man, Woman, Pro Day Pro et formules partenaires.",
};

function parseUniverseParam(value: string | undefined): ProductLineWeb | undefined {
  if (value === "homme" || value === "woman" || value === "pro") return value;
  return undefined;
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const { u } = await searchParams;
  const initialUniverse = parseUniverseParam(u) ?? "homme";

  return (
    <>
      <PageHeader
        kicker="TARIFS"
        title="Gratuit pour démarrer. Pro pour aller plus loin."
        description="Choisissez votre univers — Man, Woman ou Pro — puis le plan adapté à votre rôle. Mensuel = tarif de base ; annuel = 12 mois avec 20 % de remise."
      />
      <section className="py-16">
        <PricingTable initialUniverse={initialUniverse} />
      </section>
      <section className="border-t border-neutral-200 bg-neutral-50 py-20">
        <SponsorPricingSection compact showPillars />
        <p className="mx-auto mt-10 max-w-xl px-4 text-center text-sm text-proday-muted sm:px-6">
          Piliers de valeur, devis Territorial et inscription bêta partenaire sur{" "}
          <Link href={ROUTES.partners} className="font-medium text-proday-ink underline">
            la page Partenaires
          </Link>
          .
        </p>
      </section>
    </>
  );
}
