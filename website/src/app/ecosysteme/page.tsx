import type { Metadata } from "next";
import { EcosystemMap } from "@/components/interactive/EcosystemMap";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Carte des acteurs",
  description:
    "Joueurs, clubs, coachs, recruteurs et organisateurs. Reliés par Mercato et Arène.",
};

export default function EcosystemPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.ecosystem}
        kicker="ACTEURS"
        title="Tous les acteurs, un même réseau"
        description="Cliquez sur les nœuds. Comment ProDay relie votre saison à travers les cinq pôles et les rôles intégrés."
        image="/images/football-club-01.jpg"
        dark
      />
      <PageBody py="sm">
        <EcosystemMap />
      </PageBody>
    </>
  );
}
