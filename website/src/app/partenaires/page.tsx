import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SponsorPricingSection } from "@/components/sponsor/SponsorPricingSection";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Espace Partenaires",
  description:
    "Découverte gratuite, Territorial 49 €/mois ou National Pro 99 €/mois — visibilité clubs, offres sponsors et campagnes locales sur ProDay.",
};

export default function PartenairesPage() {
  return (
    <>
      <PageHeader
        kicker="PARTENAIRES"
        title="Touchez clubs, joueurs et organisateurs"
        description="Visibilité mesurable sur votre territoire — sans intermédiaire. Trois formules adaptées aux marques locales et nationales."
        image="/showcase/classic-exp-sponsors.jpg"
        accent="pro"
      />
      <section className="py-16">
        <SponsorPricingSection />
        <div className="mx-auto mt-16 max-w-3xl px-4 text-center sm:px-6">
          <p className="text-proday-muted">
            Inscrivez-vous à la bêta en tant que partenaire pour préparer votre espace Sponsors
            dès l&apos;ouverture mobile.
          </p>
          <Link
            href={`${ROUTES.beta}?role=sponsor`}
            className="mt-6 inline-block rounded-full bg-blue-800 px-8 py-3.5 text-sm font-semibold text-white hover:bg-blue-900"
          >
            Rejoindre la bêta — rôle Partenaire
          </Link>
        </div>
      </section>
    </>
  );
}
