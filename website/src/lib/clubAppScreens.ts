/** Captures réelles — Pôle Club dans l’app ProDay. */

export type ClubAppScreen = {
  id: string;
  src: string;
  label: string;
  caption: string;
};

export const CLUB_APP_SCREENS: ClubAppScreen[] = [
  {
    id: "accueil",
    src: "/images/app/club/club-accueil.jpg",
    label: "Accueil",
    caption: "Priorité du jour, équipes et actions urgentes du club.",
  },
  {
    id: "equipes",
    src: "/images/app/club/club-equipes.jpg",
    label: "Équipes",
    caption: "Catégories, licenciés et coachs · le roster en un coup d’œil.",
  },
  {
    id: "matchs",
    src: "/images/app/club/club-matchs.jpg",
    label: "Matchs",
    caption: "Calendrier, invitations entre clubs et convocations.",
  },
  {
    id: "outils",
    src: "/images/app/club/club-outils.jpg",
    label: "Outils",
    caption: "Modules club et raccourci vers le Pôle Président.",
  },
  {
    id: "identite",
    src: "/images/app/club/club-identite.jpg",
    label: "Club",
    caption: "Identité, pack, droits, finances et couleurs du club.",
  },
];
