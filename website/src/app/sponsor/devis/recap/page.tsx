import type { Metadata } from "next";
import { DevisRecapStep } from "@/components/sponsor/devis/DevisRecap";

export const metadata: Metadata = {
  title: "Devis · Récapitulatif · ProDay Sponsor",
  description: "Vérifiez et envoyez votre demande de devis partenaire ProDay.",
};

export default function SponsorDevisRecapPage() {
  return <DevisRecapStep />;
}
