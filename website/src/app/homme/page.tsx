import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleExplorer } from "@/components/ModuleExplorer";
import { HOMME_BRAND } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pro Day Man",
  description:
    "Le foot masculin amateur : Mercato M, matchs, Arena et CV joueur par ProDay.",
};

export default function HommePage() {
  return (
    <>
      <PageHeader
        kicker={HOMME_BRAND.tagline}
        title="Le foot masculin amateur."
        description={HOMME_BRAND.mission}
        image="/showcase/classic-discover-hero.jpg"
        accent="default"
      />
      <section className="py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold">Modules Man</h2>
          <p className="mt-2 text-proday-muted">
            Mercato M, matchs, Arena, pôle santé et Pulse — l&apos;écosystème complet pour
            joueurs.
          </p>
        </div>
        <ModuleExplorer />
      </section>
      <section className="bg-neutral-900 py-16 text-center text-white">
        <h2 className="text-2xl font-bold">Créez votre compte Man</h2>
        <p className="mx-auto mt-3 max-w-md text-neutral-300">
          Joueurs foot masculin amateur — inscription en quelques minutes. Clubs et recruteurs
          : univers Pro Day Pro.
        </p>
        <Link
          href={ROUTES.beta}
          className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-neutral-900"
        >
          Rejoindre la beta Man
        </Link>
      </section>
    </>
  );
}
