import type { Metadata } from "next";
import { PulseSimulator } from "@/components/PulseSimulator";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Pulse ProDay",
  description:
    "Simulez votre score de visibilité : profil, stats, activité et confiance.",
};

export default function PulsePage() {
  return (
    <>
      <PageHeader
        kicker="PULSE PRODAY"
        title="Votre score de visibilité"
        description="Indicateur exclusif ProDay — plus il monte, plus vous êtes visible des clubs et coachs."
        image="/showcase/classic-exp-pulse.jpg"
      />
      <PulseSimulator fullPage />
    </>
  );
}
