/** Captures réelles — Pôle Parent dans l’app ProDay. */

export type ParentAppScreen = {
  id: string;
  src: string;
  label: string;
  caption: string;
};

export const PARENT_APP_SCREENS: ParentAppScreen[] = [
  {
    id: "accueil",
    src: "/images/app/parent/parent-accueil.jpg",
    label: "Accueil",
    caption: "Vue famille — lier un enfant pour suivre matchs et agenda.",
  },
  {
    id: "guide",
    src: "/images/app/parent/parent-guide.jpg",
    label: "Guide",
    caption: "Suggestions IA — messages, trajets et cadre, sans étouffer.",
  },
  {
    id: "menu",
    src: "/images/app/parent/parent-menu.jpg",
    label: "Menu",
    caption: "Outils famille — supervision, contacts et raccourcis du pôle.",
  },
  {
    id: "profil",
    src: "/images/app/parent/parent-profil.jpg",
    label: "Profil",
    caption: "Réglages — lier un enfant, notifications et déconnexion.",
  },
];
