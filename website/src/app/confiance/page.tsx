import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { VerificationTimeline } from "@/components/VerificationTimeline";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Confiance ProDay",
  description:
    "Vérification coach et agent, badges, contrôle parental — transparence pour clubs et familles.",
};

export default function TrustPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.trust}
        kicker="CONFIANCE"
        title="Staff certifié, familles rassurées"
        description="Diplômes et licences validés avant messagerie complète. Contrôle parental pour les comptes mineurs."
        image="/images/football-coach-01.jpg"
        dark
      />
      <VerificationTimeline fullPage />
      <PremiumSection
        kicker="REJOINDRE"
        title="Prêt pour un écosystème de confiance ?"
        description="Inscrivez-vous sur la liste d'attente — vérification staff et espace famille dès l'ouverture."
        bordered
      >
        <div className="text-center">
          <PremiumButton href={ROUTES.betaWaitlist}>S&apos;inscrire</PremiumButton>
        </div>
      </PremiumSection>
    </>
  );
}
