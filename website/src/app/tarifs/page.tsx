import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PolesPricingLayout } from "@/components/pricing/PolesPricingLayout";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "4 pôles distincts — Joueur, Pro, Santé et Partenaires. Gratuit et Pro, mensuel ou annuel −20 %.",
};

export default function PricingPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.pricing}
        kicker="TARIFS"
        title="Quatre pôles, quatre formules"
        description="Joueur, Pro, Santé et Partenaires — comparez les offres découverte et Pro. Mensuel au tarif de base, annuel avec 20 % de remise."
        image="/showcase/classic-exp-messages.jpg"
        dark
      />
      <PolesPricingLayout />
    </>
  );
}
