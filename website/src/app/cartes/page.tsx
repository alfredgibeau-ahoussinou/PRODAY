import type { Metadata } from "next";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Cartes ProDay",
  description: "Passeport numérique ProDay — bientôt disponible.",
};

export default function CartesPage() {
  return (
    <TerminalPage>
      <ImmersivePoleHero
        brand="Pro Day Cartes"
        headline="Bientôt disponible."
        support="Les passeports numériques ProDay arrivent dans l’app."
        video="/videos/hero-match.mp4"
        poster="/images/football-pro-01.jpg"
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Liste d’attente"
        secondaryHref={ROUTES.features}
        secondaryLabel="Fonctionnalités"
      />
      <TerminalCta
        title="Rejoindre la bêta."
        description="Sois prévenu dès que les cartes ProDay seront en ligne."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Liste d’attente"
        secondaryHref={ROUTES.demo}
        secondaryLabel="Essayer la démo"
      />
    </TerminalPage>
  );
}
