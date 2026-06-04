import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/interactive/FaqAccordion";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions fréquentes sur ProDay, Woman, Pulse et la beta.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        kicker="FAQ"
        title="Questions fréquentes"
        description="Tout ce qu'il faut savoir avant de rejoindre la beta ProDay."
      />
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <FaqAccordion />
          <p className="mt-12 text-center text-proday-muted">
            Une autre question ?{" "}
            <Link href={ROUTES.beta} className="font-semibold text-proday-ink underline">
              Contactez-nous via la beta
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
