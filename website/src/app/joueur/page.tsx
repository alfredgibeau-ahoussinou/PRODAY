import type { Metadata } from "next";
import { Suspense } from "react";
import { FutCardStudio } from "@/components/cards/FutCardStudio";
import { JoueurAppHub } from "@/components/poles/JoueurAppHub";
import { JoueurWhoAreYouGate } from "@/components/poles/JoueurWhoAreYouGate";

export const metadata: Metadata = {
  title: "Pôle Joueur · Qui es tu ? & Carte FUT 3D",
  description:
    "Monde Joueur ProDay 3D/4D : choisis ton profil, génère et simule ta carte FUT 3D avec statistiques en temps réel. Accueil, matchs, saison et profil dans l’app.",
};

/** Porte cinéma 3D — hors shell Terminal du site — + vitrine app + simulateur de carte FUT 3D. */
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

      <div id="carte-simulateur">
        <FutCardStudio
          headline="Simulateur de Carte Joueur ProDay 3D"
          subtitle="Personnalise ta carte comme dans l'application : règle tes caractéristiques (OVR, Vitesse, Tir, Passe, Dribble, Défense, Physique, Poste) et teste les reflets holographiques en 3D."
        />
      </div>

      <JoueurAppHub />
    </>
  );
}
