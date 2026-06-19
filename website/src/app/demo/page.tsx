import type { Metadata } from "next";
import { DemoPageContent } from "@/components/demo/DemoPageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ProductLineWeb } from "@/lib/content";

export const metadata: Metadata = {
  title: "Démo interactive",
  description:
    "Testez la navigation ProDay : 9 onglets (Accueil, Mercato, Matchs, Reels, Fil, Covoiturage, Santé, Messages, Profil) avec transitions fluides.",
};

function parseUniverseParam(value: string | undefined): ProductLineWeb {
  if (value === "homme" || value === "woman" || value === "pro" || value === "sante") {
    return value;
  }
  return "homme";
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const { u } = await searchParams;
  const universe = parseUniverseParam(u);

  return (
    <>
      <PageHeader
        kicker="DÉMO"
        title="Naviguez comme dans l'app"
        description="Parcourez les 9 onglets — Accueil, Mercato, Matchs, Reels, Fil, Covoiturage, Santé, Messages et Profil — avec des transitions en temps réel."
        image={
          universe === "woman"
            ? "/showcase/woman/woman-discover-hero.jpg"
            : universe === "pro"
              ? "/showcase/classic-staff.jpg"
              : universe === "sante"
                ? "/showcase/classic-exp-profile.jpg"
                : "/showcase/classic-discover-hero.jpg"
        }
        dark={universe === "homme"}
        accent={
          universe === "woman"
            ? "woman"
            : universe === "pro"
              ? "pro"
              : universe === "sante"
                ? "sante"
                : "default"
        }
      />
      <DemoPageContent universe={universe} />
    </>
  );
}
