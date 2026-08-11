import type { Metadata } from "next";
import { Suspense } from "react";
import { JoueurExperiencePageClient } from "@/components/poles/JoueurExperiencePageClient";

export const metadata: Metadata = {
  title: "Pôle Joueur · Univers 3D",
  description:
    "Univers Joueur immersif ProDay — jeune, ado ou adulte, animations 3D/4D adaptées.",
};

/** Expérience immersive dédiée après « Qui es-tu ? ». */
export default function JoueurExperiencePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100svh] items-center justify-center bg-[#01040f] text-white">
          <p className="font-display text-2xl">Chargement du monde…</p>
        </div>
      }
    >
      <JoueurExperiencePageClient />
    </Suspense>
  );
}
