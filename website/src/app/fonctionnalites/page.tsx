import type { Metadata } from "next";
import { FeaturesImmersive } from "@/components/features/FeaturesImmersive";
import { TerminalPage } from "@/components/terminal";

export const metadata: Metadata = {
  title: "Fonctionnalités",
  description:
    "ProDay : portes d'entrée Joueur, Club, Coach, Parent, Supporter, Sponsor vers le même écosystème. Objets métier du football, pas Notion, pas Discord.",
};

export default function FeaturesPage() {
  return (
    <TerminalPage>
      <FeaturesImmersive />
    </TerminalPage>
  );
}
