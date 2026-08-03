import type { Metadata } from "next";
import { DevisContactStep } from "@/components/sponsor/devis/DevisSteps";

export const metadata: Metadata = {
  title: "Devis · Contact · ProDay Sponsor",
  description: "Coordonnées du contact pour votre devis partenaire ProDay.",
};

export default function SponsorDevisContactPage() {
  return <DevisContactStep />;
}
