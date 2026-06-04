import type { Metadata } from "next";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsBar } from "@/components/StatsBar";
import { BETA_PITCH } from "@/lib/content";

export const metadata: Metadata = {
  title: "Rejoindre la bêta",
  description:
    "Inscrivez-vous à la bêta ProDay — informations quotidiennes sur l'avancement et accès prioritaire.",
};

export default function BetaPage() {
  return (
    <>
      <PageHeader
        kicker="BÊTA"
        title="Rejoignez ProDay en avant-première"
        description={BETA_PITCH.summary}
      />
      <StatsBar />
      <WaitlistForm fullPage />
    </>
  );
}
