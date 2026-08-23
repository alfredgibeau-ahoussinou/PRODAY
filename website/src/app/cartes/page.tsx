import type { Metadata } from "next";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Carte Joueur ProDay · Fiche sportive",
  description:
    "Carte joueur réelle : photo, poste, stats, vidéos et objectifs. Partageable avec coachs et clubs. Sans note artificielle ni badge de prestige.",
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
        headline="Le joueur réel. En carte."
        support="Une fiche sportive digitale à partager avec un coach ou un club : selon vos autorisations. Sans note globale, sans badge Elite."
        video="/videos/hero-match.mp4"
        poster="/images/football-pro-01.jpg"
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta"
        secondaryHref={ROUTES.joueur}
        secondaryLabel="Espace Joueur"
      />

      <section
        id="cartes"
        className="border-t border-white/10 bg-[#050505] px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#5B75FF]">
            Carte Joueur ProDay
          </p>
          <h2 className="mt-4 font-display text-[clamp(1.6rem,3.5vw,2.4rem)] font-medium tracking-[-0.03em] text-white">
            Présenter le joueur. Pas le noter.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55">
            Style carte de football moderne, contenu réel. Les cartes joueur
            arrivent bientôt dans l’app : voici ce qu’elles afficheront.
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
            tarif horaire et demandes de séances.
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
