import type { Metadata } from "next";
import { RoadmapTimeline } from "@/components/interactive/RoadmapTimeline";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Ce qui est livré, en cours et à venir sur ProDay.",
};

export default function RoadmapPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.roadmap}
        kicker="ROADMAP"
        title="Transparence produit"
        description="Mercato, Live Stats, Arena — et la suite. Voici où en est ProDay."
        dark
      />
      <PageBody>
        <RoadmapTimeline />
      </PageBody>
    </>
  );
}
