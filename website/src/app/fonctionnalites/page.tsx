import type { Metadata } from "next";
import { FeaturesImmersive } from "@/components/features/FeaturesImmersive";
import { TerminalPage } from "@/components/terminal";

export const metadata: Metadata = {
  title: "Fonctionnalités",
  description:
    "ProDay en cinq pôles : Joueur, Club, Coach, Supporter, Sponsor. Smart Tactics, Mercato, matchs, covoiturage, fil et reels.",
};

export default function FeaturesPage() {
  return (
    <TerminalPage>
      <FeaturesImmersive />
    </TerminalPage>
  );
}
