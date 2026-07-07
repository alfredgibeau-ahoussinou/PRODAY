import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pro Day Pro Club",
  description:
    "Structures et clubs — équipes, recrutement, calendrier et vitrine.",
};

export default function ProClubPage() {
  return <UniversePage universe="pro_club" />;
}
