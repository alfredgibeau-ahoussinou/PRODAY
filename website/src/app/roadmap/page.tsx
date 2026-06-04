import type { Metadata } from "next";
import { RoadmapTimeline } from "@/components/interactive/RoadmapTimeline";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Ce qui est livré, en cours et à venir sur ProDay.",
};

export default function RoadmapPage() {
  return (
    <>
      <PageHeader
        kicker="ROADMAP"
        title="Transparence produit"
        description="Mercato, Live Stats, Arena — et la suite. Voici où en est ProDay."
      />
      <section className="py-16">
        <RoadmapTimeline />
      </section>
    </>
  );
}
