/** Captures réelles — Pôle Coach dans l’app ProDay. */

export type CoachAppScreen = {
  id: string;
  src: string;
  label: string;
  caption: string;
};

export const COACH_APP_SCREENS: CoachAppScreen[] = [
  {
    id: "accueil",
    src: "/images/app/coach/coach-accueil.jpg",
    label: "Accueil",
    caption: "Calendrier · matchs, séances et planning au même endroit.",
  },
  {
    id: "equipe",
    src: "/images/app/coach/coach-equipe.jpg",
    label: "Équipe",
    caption: "Effectif tactique · composition 4-2-3-1 sur le terrain.",
  },
  {
    id: "joueurs",
    src: "/images/app/coach/coach-joueurs.jpg",
    label: "Joueurs",
    caption: "Liste des licenciés · forme, poste et disponibilité.",
  },
  {
    id: "ia",
    src: "/images/app/coach/coach-ia.jpg",
    label: "IA",
    caption: "Assistant IA · préparation, consignes et questions terrain.",
  },
  {
    id: "menu",
    src: "/images/app/coach/coach-menu.jpg",
    label: "Menu",
    caption: "Tous les modules du Pôle Coach à portée de main.",
  },
  {
    id: "profil",
    src: "/images/app/coach/coach-profil.jpg",
    label: "Profil",
    caption: "Parcours coach · diplômes, philosophie et clubs entraînés.",
  },
];
