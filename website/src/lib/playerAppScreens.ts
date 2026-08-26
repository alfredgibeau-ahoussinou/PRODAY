/** Captures réelles — Pôle Joueur dans l’app ProDay. */

export type PlayerAppScreen = {
  id: string;
  src: string;
  label: string;
  caption: string;
};

export const PLAYER_APP_SCREENS: PlayerAppScreen[] = [
  {
    id: "accueil",
    src: "/images/app/player/player-accueil.jpg",
    label: "Accueil",
    caption: "Parcours du jour · forme, objectifs et carte joueur.",
  },
  {
    id: "matchs",
    src: "/images/app/player/player-matchs.jpg",
    label: "Matchs",
    caption: "Centre Match · calendrier, lieu et préparation.",
  },
  {
    id: "saison",
    src: "/images/app/player/player-saison.jpg",
    label: "Saison",
    caption: "Stats et progression sur toute la saison.",
  },
  {
    id: "profil",
    src: "/images/app/player/player-profil.jpg",
    label: "Profil",
    caption: "Compte, performance et identité sportive.",
  },
  {
    id: "plus",
    src: "/images/app/player/player-menu.jpg",
    label: "Plus",
    caption: "Tout ProDay · modules et raccourcis du pôle.",
  },
];
