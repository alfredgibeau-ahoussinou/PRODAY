import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCtaBand } from "@/components/layout/PageCtaBand";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { SponsorPricingSection } from "@/components/sponsor/SponsorPricingSection";
import { PremiumButton } from "@/components/ui/PremiumButton";
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
        pathname={ROUTES.partenaires}
        kicker="PARTENAIRES"
        title="Visibilité auprès des clubs et des joueurs"
        description="Visibilité mesurable sur votre territoire — sans intermédiaire. Trois formules adaptées aux marques locales et nationales."
        image="/images/football-club-01.jpg"
        accent="sponsor"
        dark
      />
      <PremiumSection
        kicker="FORMULES"
        title="Trois niveaux de visibilité"
        description="Découverte gratuite pour tester, Territorial pour les marques locales, National Pro pour une couverture élargie."
        pole="sponsor"
        bordered={false}
      >
        <SponsorPricingSection dark />
      </PremiumSection>
      <PageCtaBand pole="sponsor" align="between">
        <p className="max-w-xl text-center text-white/55 sm:text-left">
          Inscrivez-vous sur la liste d&apos;attente en tant que partenaire pour préparer votre espace
          Sponsors dès l&apos;ouverture mobile.
        </p>
        <PremiumButton href={`${ROUTES.betaWaitlist}?role=sponsor`}>
          Accès anticipé — rôle Partenaire
        </PremiumButton>
      </PageCtaBand>
    </>
  );
}
