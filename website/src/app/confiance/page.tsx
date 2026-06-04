import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { VerificationTimeline } from "@/components/VerificationTimeline";
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
        kicker="CONFIANCE"
        title="Staff certifié, familles rassurées"
        description="Diplômes et licences validés avant messagerie complète. Contrôle parental pour les comptes mineurs."
        image="/showcase/classic-staff.jpg"
        dark
      />
      <VerificationTimeline fullPage />
      <section className="border-t border-neutral-200 py-16">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-proday-muted">
            Prêt à rejoindre un écosystème de confiance ?
          </p>
          <Link
            href={ROUTES.beta}
            className="mt-6 inline-block rounded-full bg-proday-ink px-8 py-3 text-sm font-semibold text-white"
          >
            S&apos;inscrire à la beta
          </Link>
        </div>
      </section>
    </>
  );
}
