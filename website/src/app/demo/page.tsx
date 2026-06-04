import type { Metadata } from "next";
import { PhoneDemo } from "@/components/PhoneDemo";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Démo interactive",
  description:
    "Testez la navigation ProDay : 5 onglets, transitions fluides comme sur mobile.",
};

export default function DemoPage() {
  return (
    <>
      <PageHeader
        kicker="DÉMO"
        title="Naviguez comme dans l'app"
        description="Cliquez sur les onglets Accueil, Mercato, Matchs, Messages et Profil — l'écran change en temps réel."
        image="/showcase/classic-discover-hero.jpg"
        dark
      />
      <PhoneDemo fullPage />
    </>
  );
}
