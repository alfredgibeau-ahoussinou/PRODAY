import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProModuleExplorer } from "@/components/pro/ProModuleExplorer";
import { PRO_BRAND } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pro Day Pro",
  description:
    "Recruteurs, coach, agent, club et pôle santé — Mercato Pro et réseau vérifié par ProDay.",
};

export default function ProPage() {
  return (
    <>
      <PageHeader
        kicker={PRO_BRAND.tagline}
        title="Les pros du foot."
        description={PRO_BRAND.mission}
        image="/showcase/classic-staff.jpg"
        accent="pro"
      />
      <section className="py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-blue-950">
            Modules professionnels
          </h2>
          <p className="mt-2 text-proday-muted">
            Recruteurs (club, coach, agent), pôle santé et réseau Pro — profils vérifiés,
            Mercato Pro et messagerie sécurisée.
          </p>
        </div>
        <ProModuleExplorer />
      </section>
      <section className="bg-gradient-to-br from-blue-900 to-slate-950 py-16 text-center text-white">
        <h2 className="text-2xl font-bold">Créez votre compte Pro</h2>
        <p className="mx-auto mt-3 max-w-md text-blue-100">
          Recruteur, coach, agent, club, pôle santé, organisateur ou partenaire — validation
          métier incluse.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={ROUTES.beta}
            className="inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-blue-900"
          >
            Rejoindre la beta Pro
          </Link>
          <Link
            href={ROUTES.pricing}
            className="inline-block rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white"
          >
            Voir les tarifs Pro
          </Link>
        </div>
      </section>
    </>
  );
}
