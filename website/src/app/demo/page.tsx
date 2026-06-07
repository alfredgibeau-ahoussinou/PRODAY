import type { Metadata } from "next";
import { DemoPageContent } from "@/components/demo/DemoPageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ProductLineWeb } from "@/lib/content";

export const metadata: Metadata = {
  title: "Démo interactive",
  description:
    "Testez la navigation ProDay : 7 onglets (Accueil, Mercato, Matchs, Covoiturage, Santé, Messages, Profil) avec transitions fluides.",
};

function parseUniverseParam(value: string | undefined): ProductLineWeb {
  if (value === "homme" || value === "woman" || value === "pro") return value;
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
        description="Parcourez les 7 onglets — Accueil, Mercato, Matchs, Covoiturage, Santé, Messages et Profil — avec des transitions en temps réel."
        image={
          universe === "woman"
            ? "/showcase/woman/woman-discover-hero.jpg"
            : universe === "pro"
              ? "/showcase/classic-staff.jpg"
              : "/showcase/classic-discover-hero.jpg"
        }
        dark={universe === "homme"}
        accent={universe === "woman" ? "woman" : universe === "pro" ? "pro" : "default"}
      />
      <DemoPageContent universe={universe} />
    </>
  );
}
