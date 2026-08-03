import type { Metadata } from "next";
import { Suspense } from "react";
import { DevisEntrepriseStep } from "@/components/sponsor/devis/DevisSteps";

export const metadata: Metadata = {
  title: "Devis · Entreprise · ProDay Sponsor",
  description: "Informations entreprise pour votre devis partenaire ProDay.",
};

export default function SponsorDevisEntreprisePage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-white/50">Chargement…</div>}>
      <DevisEntrepriseStep />
    </Suspense>
  );
}
