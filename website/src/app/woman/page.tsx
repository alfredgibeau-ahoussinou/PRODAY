import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { WomanModuleExplorer } from "@/components/woman/WomanModuleExplorer";
import { PulseSimulator } from "@/components/PulseSimulator";
import { WOMAN_BRAND } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "ProDay Woman",
  description:
    "Le foot au féminin : Mercato F, matchs, Arena et profil joueuse par ProDay.",
};

export default function WomanPage() {
  return (
    <>
      <PageHeader
        kicker={WOMAN_BRAND.tagline}
        title="Le foot au féminin."
        description={WOMAN_BRAND.mission}
        image="/showcase/woman/woman-discover-hero.jpg"
        accent="woman"
      />
      <section className="py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-pink-950">
            Modules dédiés au foot F
          </h2>
          <p className="mt-2 text-proday-muted">
            Mercato F, matchs, Arena et profil joueuse — même puissance ProDay,
            univers pensé pour les filles et seniors F.
          </p>
        </div>
        <WomanModuleExplorer />
      </section>
      <section className="bg-pink-50/50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold">Pulse joueuse</h2>
          <p className="mt-2 text-proday-muted">
            Le même simulateur Pulse — adapté à votre visibilité sur le Mercato F.
          </p>
        </div>
        <PulseSimulator fullPage variant="woman" />
      </section>
      <section className="bg-gradient-to-br from-pink-800 to-rose-950 py-16 text-center text-white">
        <h2 className="text-2xl font-bold">Créez votre compte Woman</h2>
        <p className="mx-auto mt-3 max-w-md text-pink-100">
          Inscription joueuse en quelques minutes — univers rose ProDay.
        </p>
        <Link
          href={ROUTES.beta}
          className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-pink-900"
        >
          Rejoindre la beta Woman
        </Link>
      </section>
    </>
  );
}
