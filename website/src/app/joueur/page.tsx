import type { Metadata } from "next";
import { Suspense } from "react";
import { JoueurAppHub } from "@/components/poles/JoueurAppHub";
import { JoueurWhoAreYouGate } from "@/components/poles/JoueurWhoAreYouGate";

export const metadata: Metadata = {
  title: "Pôle Joueur · Qui es tu ?",
  description:
    "Monde Joueur ProDay 3D/4D · choisis ton profil, ouvre ton univers. Accueil, matchs, saison et profil dans l’app.",
};

/** Porte cinéma 3D — hors shell Terminal du site — + vitrine app. */
export default function JoueurPoleGatePage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-[100svh] items-end bg-[#01040f] px-6 pb-20">
            <p className="font-display text-5xl text-white">Qui es tu ?</p>
          </div>
        }
      >
        <JoueurWhoAreYouGate />
      </Suspense>
      <JoueurAppHub />
    </>
  );
}
