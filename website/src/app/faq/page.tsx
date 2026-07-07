import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/interactive/FaqAccordion";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions fréquentes sur ProDay, les quatre pôles et le lancement.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.faq}
        kicker="FAQ"
        title="Questions fréquentes"
        description="Tout ce qu'il faut savoir avant l'inscription — tarifs, pôles, Reels et partenaires."
        dark
      />
      <PageBody narrow>
        <FaqAccordion />
        <p className="mt-12 text-center text-white/55">
            Une autre question ?{" "}
            <Link href={ROUTES.betaWaitlist} className="font-semibold text-white underline">
              Nous contacter via la liste d&apos;attente
            </Link>
        </p>
      </PageBody>
    </>
  );
}
