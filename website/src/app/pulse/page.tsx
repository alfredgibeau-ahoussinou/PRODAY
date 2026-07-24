import type { Metadata } from "next";
import { PulseSimulator } from "@/components/PulseSimulator";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/routes";
import { PULSE_DISPLAY_KICKER, PULSE_DISPLAY_NAME_FULL } from "@/lib/pulseBrand";

export const metadata: Metadata = {
  title: PULSE_DISPLAY_NAME_FULL,
  description:
    "Simulez votre score de visibilité : profil, stats, activité et confiance.",
};

export default function PulsePage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.pulse}
        kicker={PULSE_DISPLAY_KICKER}
        title="Votre score de visibilité"
        description="Plus le score monte, plus vous êtes visible des clubs et coachs."
        image="/showcase/classic-exp-pulse.jpg"
        accent="joueur"
        dark
      />
      <PulseSimulator fullPage />
    </>
  );
}
