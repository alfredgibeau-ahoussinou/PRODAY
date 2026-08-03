import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { VerificationTimeline } from "@/components/VerificationTimeline";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Confiance ProDay",
  description:
    "Vérification coach et agent, badge joueur vérifié, confidentialité contacts et contrôle parental.",
};

export default function TrustPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.trust}
        kicker="CONFIANCE"
        title="Staff certifié, joueurs vérifiés, familles rassurées"
        description="Diplômes et licences validés avant messagerie complète. Badge joueur vérifié (licence ou club). Contrôle parental pour les comptes mineurs."
        image="/showcase/classic-staff.jpg"
        dark
      />
      <VerificationTimeline fullPage id="verification" />
      <PremiumSection
        kicker="JOUEUR"
        title="Badge joueur vérifié"
        description="Licence ou certification club. Les recruteurs filtrent aussi par badge Amateur / Centre / Professionnel."
        bordered
      >
        <p className="mx-auto max-w-2xl text-center text-sm text-white/70">
          Confidentialité contacts : choisissez qui voit téléphone et email. Les agents passent par une demande de message (accept / refuse) avant conversation.
        </p>
        <div className="mt-6 text-center">
          <Link
            href={ROUTES.joueur}
            className="text-sm font-semibold text-[var(--proday-accent)] hover:underline"
          >
            Voir le Pôle Joueur
          </Link>
        </div>
      </PremiumSection>
      <PremiumSection
        kicker="REJOINDRE"
        title="Prêt pour un cadre de confiance ?"
        description="Inscrivez-vous sur la liste d'attente. Vérification staff, badge joueur et espace famille dès l'ouverture."
        bordered
      >
        <div className="text-center">
          <PremiumButton href={ROUTES.betaWaitlist}>S&apos;inscrire</PremiumButton>
        </div>
      </PremiumSection>
    </>
  );
}
