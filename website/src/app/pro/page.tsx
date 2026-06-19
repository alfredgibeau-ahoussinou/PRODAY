import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pro Day Pro",
  description:
    "Recruteurs, coach, agent, club et organisateur — Mercato Pro et réseau vérifié.",
};

export default function ProPage() {
  return <UniversePage universe="pro" />;
}
