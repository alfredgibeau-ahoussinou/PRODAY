import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "ProDay Woman",
  description:
    "Le foot au féminin : Mercato F, matchs, Arena, Pulse et profil joueuse — univers Woman.",
};

export default function WomanPage() {
  return <UniversePage universe="woman" />;
}
