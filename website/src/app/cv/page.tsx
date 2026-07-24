import type { Metadata } from "next";
import { CvPreview } from "@/components/interactive/CvPreview";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ProductLineWeb } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "CV foot en ligne",
  description: "CV foot vivant exportable en PDF. Alimenté par Live Stats.",
};

function parseUniverseParam(value: string | undefined): ProductLineWeb {
  if (value === "homme" || value === "woman" || value === "pro") return value;
  return "homme";
}

export default async function CvPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const { u } = await searchParams;
  const universe = parseUniverseParam(u);

  return (
    <>
      <PageHeader
        pathname={ROUTES.cv}
        kicker="CV VIVANT"
        title={
          universe === "woman"
            ? "Votre CV joueuse professionnel"
            : universe === "pro"
              ? "Votre CV staff professionnel"
              : "Votre CV foot professionnel"
        }
        description="Chaque match enrichit votre fiche. Export PDF en un geste depuis l'app."
        image={
          universe === "woman"
            ? "/showcase/woman/woman-profile.jpg"
            : universe === "pro"
              ? "/images/football-pro-01.jpg"
              : "/showcase/classic-profile.jpg"
        }
        accent={universe === "woman" ? "woman" : universe === "pro" ? "pro" : "joueur"}
        dark
      />
      <section className="bg-[#030303] py-16 px-4 sm:px-6">
        <CvPreview universe={universe} />
      </section>
    </>
  );
}
