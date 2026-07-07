import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pro Day Pro Joueur",
  description:
    "Joueur professionnel — carrière, visibilité scouting, portfolio et opportunités.",
};

export default function ProJoueurPage() {
  return <UniversePage universe="pro_joueur" />;
}
