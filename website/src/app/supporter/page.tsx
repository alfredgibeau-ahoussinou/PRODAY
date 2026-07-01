import type { Metadata } from "next";
import { UniversePage } from "@/components/universe/UniversePage";

export const metadata: Metadata = {
  title: "Pro Day Supporter",
  description:
    "Fans et communauté — matchs, réels, fil et messagerie, distinct du pôle Partenaires (sponsors pro).",
};

export default function SupporterPage() {
  return <UniversePage universe="supporter" />;
}
