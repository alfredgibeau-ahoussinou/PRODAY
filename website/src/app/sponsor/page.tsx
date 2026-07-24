import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCtaBand } from "@/components/layout/PageCtaBand";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { SponsorCapabilitiesGrid } from "@/components/sponsor/SponsorCapabilitiesGrid";
import { SponsorFaqAccordion } from "@/components/sponsor/SponsorFaqAccordion";
import { SponsorPricingSection } from "@/components/sponsor/SponsorPricingSection";
import { SponsorSignupWizard } from "@/components/sponsor/SponsorSignupWizard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { SPONSOR_PARTNER_CONTACT_EMAIL } from "@/lib/content";
import { SPONSOR_BRAND, SPONSOR_HERO } from "@/lib/sponsorContent";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Sponsor · Pro Day",
  description:
    "Marques et sponsors sur ProDay. Visibilité mesurée, campagnes locales et tableau de bord.",
};

export default function SponsorPolePage() {
  return (
    <div className="sponsor-pole">
      <PageHeader
        pathname={ROUTES.sponsor}
        kicker={SPONSOR_HERO.kicker}
        title={SPONSOR_HERO.title}
        description={SPONSOR_HERO.description}
        image={SPONSOR_HERO.image}
        logo={SPONSOR_BRAND.logo}
        logoAlt={SPONSOR_BRAND.name}
        accent="sponsor"
        dark
      />

      <PremiumSection
        id="capacites"
        kicker="OUTILS"
        title="Ce que votre marque peut faire"
        description="Offres, push géo, tableau de bord et vitrine vérifiée. Pour les équipes marketing."
        pole="sponsor"
        bordered={false}
      >
        <SponsorCapabilitiesGrid />
      </PremiumSection>

      <PremiumSection
        id="formules"
        kicker="FORMULES"
        title="Trois niveaux"
        description="Découverte pour tester. Territorial pour le local. National Pro pour aller plus loin."
        pole="sponsor"
      >
        <SponsorPricingSection dark />
      </PremiumSection>

      <PremiumSection
        id="inscription"
        kicker="INSCRIPTION"
        title="Parlez-nous de votre projet"
        description="Formulaire en 5 étapes. Réponse sous 48 h ouvrées."
        pole="sponsor"
        centered={false}
      >
        <div className="mx-auto max-w-3xl">
          <Suspense fallback={<div className="py-12 text-center text-white/50">Chargement du formulaire…</div>}>
            <SponsorSignupWizard />
          </Suspense>
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-white/40">
          Échange direct :{" "}
          <a
            href={`mailto:${SPONSOR_PARTNER_CONTACT_EMAIL}?subject=Demande%20sponsor%20ProDay`}
            className="font-medium text-amber-400/80 underline hover:text-amber-300"
          >
            {SPONSOR_PARTNER_CONTACT_EMAIL}
          </a>
        </p>
      </PremiumSection>

      <PremiumSection
        id="faq"
        kicker="FAQ"
        title="Questions fréquentes"
        description="Avant de rejoindre le pôle Sponsor."
        pole="sponsor"
        centered={false}
      >
        <div className="mx-auto max-w-3xl">
          <SponsorFaqAccordion />
        </div>
      </PremiumSection>

      <PageCtaBand pole="sponsor" align="between">
        <p className="max-w-xl text-center text-white/55 sm:text-left">
          Convention partenaire et conditions commerciales : documentation légale ProDay.
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:justify-end">
          <PremiumButton href={ROUTES.partenairesConvention} variant="outline" className="!border-amber-400/30 !text-amber-200">
            Convention sponsor
          </PremiumButton>
          <PremiumButton href="#inscription" className="!bg-gradient-to-r !from-amber-500 !to-amber-400 !text-slate-950">
            S&apos;inscrire
          </PremiumButton>
        </div>
      </PageCtaBand>
    </div>
  );
}
