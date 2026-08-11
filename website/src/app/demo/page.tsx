import type { Metadata } from "next";
import { DemoHero } from "@/components/demo/DemoHero";
import { DemoDisclaimer } from "@/components/demo/DemoDisclaimer";
import { DemoPageContent } from "@/components/demo/DemoPageContent";
import { TerminalCta } from "@/components/terminal";
import { parseDemoPoleParam } from "@/lib/demoPoles";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Démo interactive",
  description:
    "Explorez ProDay comme dans l’app : Joueur, Club, Coach, Supporter ou Sponsor : sans compte.",
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; u?: string }>;
}) {
  const { p, u } = await searchParams;
  const pole = parseDemoPoleParam(p, u);

  return (
    <main className="bg-black">
      <DemoHero pole={pole} />
      <div className="bg-black px-4 py-4 sm:px-6">
        <DemoDisclaimer className="max-w-6xl" />
      </div>
      <DemoPageContent pole={pole} />
      <TerminalCta
        title="Prêt pour la vraie app ?"
        description="La bêta ouvre les cinq pôles. Liste d’attente ouverte."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta"
        secondaryHref={ROUTES.features}
        secondaryLabel="Voir les fonctionnalités"
      />
    </main>
  );
}
