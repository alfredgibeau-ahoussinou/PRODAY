import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PolesPricingLayout } from "@/components/pricing/PolesPricingLayout";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Sept pôles : Amateur, Supporter, Santé, Pro Joueur, Pro Club, Pro Staff, Sponsor. Gratuit et Pro.",
};

export default function PricingPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.pricing}
        kicker="TARIFS"
        title="Tarifs par pôle"
        description="Joueur, Pro, Santé et Partenaires. Comparez les offres découverte et Pro. Mensuel au tarif de base, annuel avec 20 % de remise."
        image="/showcase/classic-exp-messages.jpg"
        dark
      />
      <section className="mx-auto max-w-4xl px-4 pb-4 pt-8 sm:px-6">
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
          <span className="font-semibold text-white/85">Parrainage :</span> invitez
          2 nouveaux membres qui s&apos;abonnent à une offre payante et gagnez 1 mois
          Pro offert. Partagez votre lien{' '}
          <code className="text-white/80">proday75.fr/?ref=VOTRECODE</code> depuis
          l&apos;app (Profil → Parrainage).
        </p>
      </section>
      <PolesPricingLayout />
    </>
  );
}
