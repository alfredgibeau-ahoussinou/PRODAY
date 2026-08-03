import type { Metadata } from "next";
import { DevisFormuleStep } from "@/components/sponsor/devis/DevisSteps";

export const metadata: Metadata = {
  title: "Devis · Formule · ProDay Sponsor",
  description: "Choisissez la formule et le budget pour votre devis ProDay Sponsor.",
};

export default function SponsorDevisFormulePage() {
  return <DevisFormuleStep />;
}
