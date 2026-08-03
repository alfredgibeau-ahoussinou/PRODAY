import type { Metadata } from "next";
import { Suspense } from "react";
import { DevisIntroPage } from "@/components/sponsor/devis/DevisSteps";

export const metadata: Metadata = {
  title: "Demander un devis · ProDay Sponsor",
  description:
    "Demandez un devis partenaire ProDay. Parcours en 5 étapes, réponse sous 48 h ouvrées.",
};

export default function SponsorDevisPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-white/50">Chargement…</div>}>
      <DevisIntroPage />
    </Suspense>
  );
}
