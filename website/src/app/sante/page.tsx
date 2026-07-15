import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { PlanDetailCard } from "@/components/poles/PlanDetailCard";
import { PoleFullBleed } from "@/components/poles/PoleFullBleed";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { SANTE_BRAND, getWebPlanById } from "@/lib/content";
import { POLE_STYLES, pricingHrefForPole } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pro Day Santé",
  description:
    "Kinés, coach mental et nutrition — annuaire vérifié, visibilité clubs et prise de RDV via l'app.",
};

export default function SantePage() {
  const physioPlan = getWebPlanById("physio_pro");
  const styles = POLE_STYLES.sante;

  return (
    <>
      <PageHeader
        pathname={ROUTES.sante}
        kicker={SANTE_BRAND.tagline}
        title="Le pôle santé du foot."
        description={SANTE_BRAND.mission}
        image="/images/football-health-01.jpg"
        logo={SANTE_BRAND.logo}
        logoAlt={SANTE_BRAND.fullName}
        accent="sante"
        dark
      />

      <PremiumSection
        kicker="PÔLE SANTÉ"
        title="Praticiens vérifiés, visibles près des clubs"
        description="Kinésithérapeutes, coachs mental, nutritionnistes et staff médical — un annuaire dédié, distinct du pôle Pro staff. Inclut aussi des vidéos éducatives (prévention, récupération) visibles par joueurs et clubs."
        pole="sante"
        bordered={false}
      >
        <div className="flex flex-wrap gap-4">
          <PremiumButton
            href={ROUTES.betaWaitlist}
            className="!bg-teal-600 !text-white hover:!bg-teal-500"
          >
            Accès anticipé Santé
          </PremiumButton>
          <PremiumButton href={pricingHrefForPole("sante")} variant="outline">
            Voir les tarifs
          </PremiumButton>
        </div>
      </PremiumSection>

      <PremiumSection
        kicker="VIDÉOS"
        title="Conseils santé en images"
        description="L'onglet Vidéos du pôle Santé permet de publier des clips courts — étirements, prévention blessures, récupération — pour accompagner les sportifs de votre zone."
        pole="sante"
      >
        <ul className="mx-auto max-w-xl space-y-3 text-sm text-white/70">
          <li className="flex gap-2">
            <span className="text-teal-400">—</span>
            Contenu éducatif visible dans l&apos;app (onglet Vidéos)
          </li>
          <li className="flex gap-2">
            <span className="text-teal-400">—</span>
            Visibilité auprès des joueurs et clubs à proximité
          </li>
          <li className="flex gap-2">
            <span className="text-teal-400">—</span>
            Complète l&apos;agenda RDV et la messagerie patients
          </li>
        </ul>
      </PremiumSection>

      {physioPlan && (
        <PoleFullBleed className={`${styles.section} py-20`}>
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className={`text-xs font-semibold tracking-[0.2em] ${styles.textMuted}`}>
              TARIF PRATICIEN
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold text-white">
              Pôle santé Pro
            </h2>
            <p className={`mt-2 text-sm ${styles.textMuted}`}>
              Formule découverte gratuite, formule Pro pour la visibilité prioritaire.
            </p>
            <div className="mt-10">
              <PlanDetailCard plan={physioPlan} yearly={false} styles={styles} />
            </div>
          </div>
        </PoleFullBleed>
      )}

      <PremiumSection
        kicker="REJOINDRE"
        title="Prêt à rejoindre l'annuaire ?"
        description="Inscrivez-vous sur la liste d'attente — les praticiens sont informés en priorité du déploiement de la prise de rendez-vous."
        pole="sante"
      >
        <div className="text-center">
          <PremiumButton href={ROUTES.betaWaitlist} className="!bg-teal-600 hover:!bg-teal-500">
            Accès anticipé
          </PremiumButton>
        </div>
      </PremiumSection>
    </>
  );
}
