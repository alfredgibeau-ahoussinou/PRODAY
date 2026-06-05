import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pro Day Man",
  description:
    "Le foot masculin amateur : Mercato M, matchs, Arena, Pulse et CV joueur — univers réservé aux joueurs.",
};

export default function HommePage() {
  return <UniversePage universe="homme" />;
}
