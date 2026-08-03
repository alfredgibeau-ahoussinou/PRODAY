import type { Metadata } from "next";
import { DevisProjetStep } from "@/components/sponsor/devis/DevisSteps";

export const metadata: Metadata = {
  title: "Devis · Projet · ProDay Sponsor",
  description: "Objectifs et ciblage pour votre devis partenaire ProDay.",
};

export default function SponsorDevisProjetPage() {
  return <DevisProjetStep />;
}
