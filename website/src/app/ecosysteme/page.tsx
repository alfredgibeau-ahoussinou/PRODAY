import type { Metadata } from "next";
import { EcosystemMap } from "@/components/interactive/EcosystemMap";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Carte des acteurs",
  description:
    "Joueurs, clubs, coachs, parents, supporters et sponsors : portes d'entrée vers le même écosystème football ProDay.",
};

export default function EcosystemPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.ecosystem}
        kicker="ÉCOSYSTÈME"
        title="Tous les acteurs, une même donnée"
        description="Des portes d'entrée — pas des produits séparés. Cliquez sur les nœuds : comment ProDay relie votre saison autour des objets métier du football."
        image="/images/football-club-01.jpg"
        dark
      />
      <PageBody py="sm">
        <EcosystemMap />
      </PageBody>
    </>
  );
}
