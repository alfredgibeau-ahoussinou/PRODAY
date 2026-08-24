/** Captures réelles — Pôle Président (Executive) dans l’app ProDay. */

export type ExecutiveAppScreen = {
  id: string;
  src: string;
  label: string;
  caption: string;
};

export const EXECUTIVE_APP_SCREENS: ExecutiveAppScreen[] = [
  {
    id: "cockpit",
    src: "/images/app/executive/executive-cockpit.jpg",
    label: "Cockpit",
    caption: "Le club en un coup d’œil — équipes, alertes, décisions.",
  },
  {
    id: "club",
    src: "/images/app/executive/executive-club.jpg",
    label: "Club",
    caption: "Structure, effectifs et vie du club depuis le QG.",
  },
  {
    id: "finances",
    src: "/images/app/executive/executive-finances.jpg",
    label: "Finances",
    caption: "Budget, adhésions et sponsors sous contrôle.",
  },
  {
    id: "menu",
    src: "/images/app/executive/executive-menu.jpg",
    label: "Menu",
    caption: "Tous les modules du Pôle Président à portée de main.",
  },
  {
    id: "assistant",
    src: "/images/app/executive/executive-assistant.jpg",
    label: "Assistant IA",
    caption: "L’IA Président pour préparer et prioriser.",
  },
];
