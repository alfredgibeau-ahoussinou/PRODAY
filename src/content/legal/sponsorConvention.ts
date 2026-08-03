/** Modèle convention partenariat sponsor — PDF / docs. */
import type { LegalSectionContent } from './fr';

export const SPONSOR_CONVENTION_META = {
  title: 'Convention de partenariat sponsor',
  subtitle: 'Modèle indicatif. À faire valider par un conseil juridique avant signature',
  updatedAt: '19 juin 2026',
  contact: 'proday.admin@gmail.com',
} as const;

export const SPONSOR_CONVENTION_PARTIES = [
  'ProDay (la Plateforme), contact : proday.admin@gmail.com. Site : https://proday75.fr',
  'Le Partenaire : [Raison sociale, SIRET, adresse, représentant légal]',
];

export const SPONSOR_CONVENTION_SECTIONS: LegalSectionContent[] = [
  {
    id: 'objet',
    title: 'Objet',
    paragraphs: [
      "Le Partenaire souhaite gagner en visibilité auprès des clubs et joueurs inscrits sur l'application mobile ProDay, en échange d'une contrepartie (financière ou en nature), dans le respect de la politique de confidentialité et des CGU applicables aux utilisateurs.",
    ],
  },
  {
    id: 'contrepartie-partenaire',
    title: 'Contrepartie du Partenaire (exemples)',
    paragraphs: [],
    bullets: [
      'Remise de 15 % sur présentation du profil ProDay en magasin',
      "Don de 10 ballons ou équipement d'une valeur de [X] €",
      "Contribution de [montant] € au financement d'un club partenaire",
    ],
  },
  {
    id: 'contrepartie-proday',
    title: 'Contrepartie ProDay',
    paragraphs: [],
    bullets: [
      "Logo du Partenaire sur l'onglet Sponsors de l'application",
      'Mention sur les maillots de 3 clubs pilotes pour la saison [année]',
      'Notification push ciblée géographiquement (rayon [ville / département])',
    ],
  },
  {
    id: 'duree',
    title: 'Durée',
    paragraphs: ['Du [date début] au [date fin], renouvelable d’un commun accord.'],
  },
  {
    id: 'donnees',
    title: 'Données et image',
    paragraphs: [
      "Le Partenaire autorise l'utilisation de son logo et de ses éléments de marque sur l'application et les supports de communication ProDay, dans le cadre défini au présent accord. ProDay s'engage à ne pas revendre les données personnelles des utilisateurs. Le traitement des données est décrit dans la politique de confidentialité ProDay.",
    ],
  },
  {
    id: 'resiliation',
    title: 'Résiliation',
    paragraphs: [
      "Chaque partie peut résilier l'accord avec un préavis de 30 jours par e-mail, sauf manquement grave. Les contenus du Partenaire seront retirés de la plateforme dans un délai raisonnable.",
    ],
  },
  {
    id: 'droit',
    title: 'Droit applicable',
    paragraphs: [
      'Le présent accord est soumis au droit français. En cas de litige, les parties rechercheront une solution amiable avant toute action judiciaire.',
    ],
  },
];
