import type { Metadata } from "next";
import { PhoneDemo } from "@/components/PhoneDemo";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ProductLineWeb } from "@/lib/content";

export const metadata: Metadata = {
  title: "Démo interactive",
  description:
    "Testez la navigation ProDay : 5 onglets, transitions fluides comme sur mobile.",
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
        description="Cliquez sur les onglets Accueil, Mercato, Matchs, Messages et Profil — l'écran change en temps réel."
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
      <PhoneDemo fullPage universe={universe} />
    </>
  );
}
