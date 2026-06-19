import type { Metadata } from "next";
import { EcosystemMap } from "@/components/interactive/EcosystemMap";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Écosystème",
  description:
    "Joueurs, recruteurs, pôle santé et organisateurs — reliés par Mercato et Arena.",
};

export default function EcosystemPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.ecosystem}
        kicker="ÉCOSYSTÈME"
        title="Tous les acteurs, un même réseau"
        description="Cliquez sur les nœuds — découvrez comment ProDay connecte votre saison à travers les 4 pôles."
        image="/showcase/classic-arena.jpg"
        dark
      />
      <section className="bg-[#030303] py-16 px-4 sm:px-6">
        <EcosystemMap />
      </section>
    </>
  );
}
