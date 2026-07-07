import type { Metadata } from "next";
import { DemoPageContent } from "@/components/demo/DemoPageContent";
import { DemoDisclaimer } from "@/components/demo/DemoDisclaimer";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ProductLineWeb } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Démo interactive",
  description:
    "Testez la navigation ProDay : 9 onglets avec transitions fluides — par univers Joueur, Pro ou Santé.",
};

function parseUniverseParam(value: string | undefined): ProductLineWeb {
  if (
    value === "homme" ||
    value === "woman" ||
    value === "amateur" ||
    value === "supporter" ||
    value === "pro" ||
    value === "sante"
  ) {
    return value;
  }
  return "homme";
}

const ACCENT_FOR: Record<ProductLineWeb, "joueur" | "woman" | "amateur" | "supporter" | "pro" | "sante"> = {
  homme: "joueur",
  woman: "woman",
  amateur: "amateur",
  supporter: "supporter",
  pro: "pro",
  sante: "sante",
};

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
        pathname={ROUTES.demo}
        kicker="DÉMO"
        title="Naviguez comme dans l'app"
        description="Parcourez les 9 onglets — Accueil, Mercato, Matchs, Reels, Fil, Covoiturage, Santé, Messages et Profil — avec des transitions en temps réel."
        image={
          universe === "woman"
            ? "/showcase/woman/woman-discover-hero.jpg"
            : universe === "pro"
              ? "/images/football-pro-01.jpg"
              : universe === "sante"
                ? "/images/football-health-01.jpg"
                : universe === "amateur"
                  ? "/images/football-amateur-01.jpg"
                  : universe === "supporter"
                    ? "/images/football-supporter-01.jpg"
                    : "/images/football-action-01.jpg"
        }
        accent={ACCENT_FOR[universe]}
        dark
      />
      <section className="bg-[#030303] pb-8 pt-4">
        <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
          <DemoDisclaimer />
        </div>
        <DemoPageContent universe={universe} />
      </section>
    </>
  );
}
