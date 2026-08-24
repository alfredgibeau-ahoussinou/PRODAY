/** Captures réelles — Pôle Sponsor dans l’app ProDay. */

export type SponsorAppScreen = {
  id: string;
  src: string;
  label: string;
  caption: string;
};

export const SPONSOR_APP_SCREENS: SponsorAppScreen[] = [
  {
    id: "accueil",
    src: "/images/app/sponsor/sponsor-accueil.jpg",
    label: "Accueil",
    caption: "Dashboard — validation, KPIs et performance marque.",
  },
  {
    id: "offres",
    src: "/images/app/sponsor/sponsor-offres.jpg",
    label: "Offres",
    caption: "Campagnes marque — nouvelles offres et contributions.",
  },
  {
    id: "financement",
    src: "/images/app/sponsor/sponsor-financement.jpg",
    label: "Financement",
    caption: "Objectifs clubs — campagnes urgentes et contributions.",
  },
  {
    id: "formules",
    src: "/images/app/sponsor/sponsor-formules.jpg",
    label: "Formules",
    caption: "Packs sponsors — Découverte, Territorial, National Pro.",
  },
  {
    id: "messages",
    src: "/images/app/sponsor/sponsor-messages.jpg",
    label: "Messages",
    caption: "Conversations clubs — modèles rapides et prospects.",
  },
  {
    id: "prospects",
    src: "/images/app/sponsor/sponsor-prospects.jpg",
    label: "Prospects",
    caption: "Clubs recommandés — contacter et qualifier.",
  },
  {
    id: "contacts",
    src: "/images/app/sponsor/sponsor-contacts.jpg",
    label: "Contacts",
    caption: "Partenaires actifs et clubs à activer sur le terrain.",
  },
  {
    id: "marque",
    src: "/images/app/sponsor/sponsor-marque.jpg",
    label: "Marque",
    caption: "Compte et identité — performance et réglages marque.",
  },
];
