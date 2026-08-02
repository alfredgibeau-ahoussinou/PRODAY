import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pôle Club — Structures & recrutement",
  description:
    "Structures et clubs. Équipes, pipeline candidatures kanban et vitrine. Calendrier et convocations : Pôle Staff.",
};

export default function ProClubPage() {
  return <UniversePage universe="pro_club" />;
}
