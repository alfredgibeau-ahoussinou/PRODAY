import type { Metadata } from "next";
import { FutCardStudio } from "@/components/cards/FutCardStudio";
import { ProDayCardsGallery } from "@/components/cards/ProDayCardsGallery";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Générateur de Cartes FUT 3D & Passeport · ProDay",
  description:
    "Générateur et simulateur interactif de cartes FUT 3D en temps réel. Ajuste tes stats OVR, Vitesse, Tir, Passe, Dribble, Défense, Physique et Poste avec rendu holographique 3D.",
};

const CARD_FIELDS = [
  "Photo, prénom, nom, âge",
  "Catégorie, club, équipe",
  "Poste principal et secondaires",
  "Pied fort, taille, objectifs",
  "Statistiques et séances réalisées",
  "Progression, vidéos, exercices",
  "Disponibilités et historique",
  "Présentation personnelle",
] as const;

export default function CartesPage() {
  return (
    <TerminalPage>
      <ImmersivePoleHero
        brand="Pro Day Cartes"
        headline="Le joueur réel. En carte FUT 3D."
        support="Générateur et simulateur de cartes interactives 3D en temps réel : ajuste tes statistiques, personnalise ton identité sportive et exporte ton profil."
        video="/videos/hero-match.mp4"
        poster="/images/football-pro-01.jpg"
        primaryHref="#studio"
        primaryLabel="Tester le Studio FUT 3D"
        secondaryHref={ROUTES.joueur}
        secondaryLabel="Espace Joueur"
      />

      <div id="studio">
        <FutCardStudio
          headline="Studio Simulateur de Cartes FUT 3D"
          subtitle="Modifie chaque curseur statistique en direct (OVR, Vitesse, Tir, Passe, Dribble, Défense, Physique, Poste) et observe l'impact immédiat sur la carte avec inclinaison 3D gyroscope et verso interactif."
        />
      </div>

      <ProDayCardsGallery
        title="La Collection ProDay : Cinq Rôles"
        support="Découvre l'ensemble des déclinaisons de cartes Joueur, Coach, Club, Supporter et Sponsor avec skins dynamiques."
        showMoreLink={false}
      />

      <section
        id="cartes"
        className="border-t border-white/10 bg-[#050505] px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#F5D04A]">
            Carte Joueur ProDay
          </p>
          <h2 className="mt-4 font-display text-[clamp(1.6rem,3.5vw,2.4rem)] font-medium tracking-[-0.03em] text-white">
            Présenter le joueur. Valoriser le talent.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55">
            Style carte de football moderne, contenu réel. Les cartes joueur
            dans l’app ProDay centralisent l’ensemble de vos performances certifiées sur le terrain.
          </p>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {CARD_FIELDS.map((field) => (
              <li
                key={field}
                className="border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70"
              >
                {field}
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm text-white/40">
            Même logique pour la Carte Coach : expérience, diplômes, spécialités,
            tactiques favorites et demandes de séances.
          </p>
        </div>
      </section>

      <TerminalCta
        title="Ta carte, ton identité sportive."
        description="Rejoins la bêta pour porter ta fiche dans l’app et la partager avec ton club."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Liste d’attente"
        secondaryHref={ROUTES.demo}
        secondaryLabel="Essayer la démo"
      />
    </TerminalPage>
  );
}
