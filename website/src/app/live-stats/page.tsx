import type { Metadata } from "next";
import { LiveStatsDemo } from "@/components/interactive/LiveStatsDemo";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Stats en direct",
  description: "Saisie en direct. Buts, passes, cartons. Votre profil se met à jour.",
};

export default function LiveStatsPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.liveStats}
        kicker="LIVE STATS"
        title="Chaque action compte"
        description="Saisissez le match en direct. Stats saison et CV alimentés automatiquement."
        image="/images/football-match-01.jpg"
        accent="joueur"
        dark
      />
      <section className="bg-[#030303] py-16">
        <LiveStatsDemo />
      </section>
    </>
  );
}
