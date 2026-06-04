import type { Metadata } from "next";
import { LiveStatsDemo } from "@/components/interactive/LiveStatsDemo";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Live Stats",
  description: "Saisie en direct — buts, passes, cartons. Votre profil se met à jour.",
};

export default function LiveStatsPage() {
  return (
    <>
      <PageHeader
        kicker="LIVE STATS"
        title="Chaque action compte"
        description="Saisissez le match en direct — stats saison et CV alimentés automatiquement."
        image="/showcase/classic-match.jpg"
        dark
      />
      <section className="py-16">
        <LiveStatsDemo />
      </section>
    </>
  );
}
