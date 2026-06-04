import type { Metadata } from "next";
import { EcosystemMap } from "@/components/interactive/EcosystemMap";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Écosystème",
  description: "Joueurs, clubs, coachs, organisateurs — reliés par Mercato et Arena.",
};

export default function EcosystemPage() {
  return (
    <>
      <PageHeader
        kicker="ÉCOSYSTÈME"
        title="Tous les acteurs, un même réseau"
        description="Cliquez sur les nœuds — découvrez comment ProDay connecte votre saison."
        image="/showcase/classic-arena.jpg"
        dark
      />
      <section className="py-16 px-4 sm:px-6">
        <EcosystemMap />
      </section>
    </>
  );
}
