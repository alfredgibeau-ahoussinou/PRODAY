import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pro Day Amateur",
  description:
    "Joueurs et coachs amateur — Mercato local, matchs, effectif et convocations.",
};

export default function AmateurPage() {
  return <UniversePage universe="amateur" />;
}
