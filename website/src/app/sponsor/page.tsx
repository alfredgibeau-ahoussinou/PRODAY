import Image from "next/image";
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
  title: "Pôle Sponsor — Pro Day",
  description:
    "Espace premium pour marques et sponsors — visibilité mesurée, campagnes géolocalisées et tableau de bord ROI sur ProDay.",
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

      {/* Bandeau signature corporate — distinct des pôles sportifs */}
      <section className="relative overflow-hidden border-b border-amber-500/10 bg-[#070605] py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 overflow-hidden rounded-2xl bg-white p-2 shadow-[0_16px_48px_-16px_rgba(212,175,55,0.45)]">
              <Image
                src={SPONSOR_BRAND.logo}
                alt={SPONSOR_BRAND.name}
                width={72}
                height={68}
                className="h-14 w-auto sm:h-16"
                priority
              />
            </div>
            <p className="font-signature text-2xl text-amber-400/90 sm:text-3xl">{SPONSOR_BRAND.tagline}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">{SPONSOR_BRAND.mission}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PremiumButton href="#inscription" className="!bg-gradient-to-r !from-amber-500 !to-amber-400 !text-slate-950 hover:!from-amber-400 hover:!to-amber-300">
                Demander un accès
              </PremiumButton>
              <PremiumButton href="#formules" variant="outline" className="!border-amber-400/30 !text-amber-200 hover:!bg-amber-400/10">
                Voir les formules
              </PremiumButton>
            </div>
          </div>
        </div>
      </section>

      <PremiumSection
        id="capacites"
        kicker="PLATEFORME"
        title="Ce que votre marque peut faire sur ProDay"
        description="Offres, push géo, dashboard ROI et vitrine vérifiée — des outils conçus pour les équipes marketing, pas pour les joueurs."
        pole="sponsor"
        bordered={false}
      >
        <SponsorCapabilitiesGrid />
      </PremiumSection>

      <PremiumSection
        id="formules"
        kicker="FORMULES"
        title="Trois niveaux de visibilité"
        description="Découverte gratuite pour tester, Territorial pour les marques locales, National Pro pour une couverture élargie."
        pole="sponsor"
      >
        <SponsorPricingSection dark />
      </PremiumSection>

      <PremiumSection
        id="inscription"
        kicker="INSCRIPTION"
        title="Parlez-nous de votre projet"
        description="Formulaire interactif en 5 étapes — notre équipe partenaires analyse votre dossier sous 48 h ouvrées."
        pole="sponsor"
        centered={false}
      >
        <div className="mx-auto max-w-3xl">
          <Suspense fallback={<div className="py-12 text-center text-white/50">Chargement du formulaire…</div>}>
            <SponsorSignupWizard />
          </Suspense>
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-white/40">
          Vous préférez un échange direct ?{" "}
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
        description="Tout ce qu'il faut savoir avant de rejoindre le pôle Sponsor."
        pole="sponsor"
        centered={false}
      >
        <div className="mx-auto max-w-3xl">
          <SponsorFaqAccordion />
        </div>
      </PremiumSection>

      <PageCtaBand pole="sponsor" align="between">
        <p className="max-w-xl text-center text-white/55 sm:text-left">
          Convention partenaire, conditions commerciales et facturation — consultez la documentation légale
          ProDay.
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
