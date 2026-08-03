import type { Metadata } from "next";
import { DevisConfirmationPage } from "@/components/sponsor/devis/DevisRecap";

export const metadata: Metadata = {
  title: "Demande envoyée · ProDay Sponsor",
  description: "Votre demande de devis partenaire ProDay a bien été transmise.",
};

export default function SponsorDevisConfirmationPage() {
  return <DevisConfirmationPage />;
}
