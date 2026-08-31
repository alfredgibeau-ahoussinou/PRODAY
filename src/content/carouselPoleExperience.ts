import type { CarouselPoleId } from '../models/CarouselPole';
import type { UniverseIdentity } from './brandExperience';
import {
  PRO_IDENTITY,
  SANTE_IDENTITY,
  SUPPORTER_IDENTITY,
} from './brandExperience';
import {
  PRODAY_COACH_BRAND,
  PRODAY_PARENT_BRAND,
  PRODAY_PRESIDENT_BRAND,
  PRODAY_PRO_CLUB_BRAND,
  PRODAY_SPONSOR_BRAND,
} from '../models/ProductLine';

const JOUEUR_IDENTITY: UniverseIdentity = {
  id: 'amateur',
  productName: 'Pro Day Joueur',
  tagline: 'CLUB · PROGRESSER · JOUER',
  heroLine: 'Ton club.\nTon jeu.',
  mission:
    'Profil, stats, convocations et covoiturage. Pass Premium optionnel pour les entraînements individuels avancés.',
  accentLabel: 'Joueur',
  mercatoLabel: 'Mercato',
  playerLabel: 'Joueur',
  cvLabel: 'CV & portfolio',
  entrySub: 'Pensé pour le football amateur et semi-professionnel',
};

const PRO_CLUB_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRO_CLUB_BRAND.name,
  tagline: PRODAY_PRO_CLUB_BRAND.tagline,
  heroLine: 'Le club\nau centre.',
  mission:
    'Équipes, catégories, licenciés, compétitions, convocations, covoiturage et permissions. Le cœur de ProDay.',
  accentLabel: 'Club',
  mercatoLabel: 'Recrutement',
  playerLabel: 'Structure',
  cvLabel: 'Vitrine club',
  entrySub: 'Dirigeants, staff et bénévoles — un seul cockpit',
};

const PRESIDENT_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRESIDENT_BRAND.name,
  tagline: PRODAY_PRESIDENT_BRAND.tagline,
  heroLine: 'La direction\ndu club.',
  mission:
    'Cockpit exécutif : santé du club, finances, décisions. Toujours lié au Pôle Club pour l’opérationnel.',
  accentLabel: 'Président',
  mercatoLabel: 'Stratégie',
  playerLabel: 'Direction',
  cvLabel: 'Pilotage',
  entrySub: 'Même club · shell exécutif distinct',
};

const COACH_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_COACH_BRAND.name,
  tagline: PRODAY_COACH_BRAND.tagline,
  heroLine: 'Votre banc\nde touche.',
  mission:
    'Profil coach, Tactique IA, préparation match, convocations, IA et analyse vidéo. Rattaché à un club.',
  accentLabel: 'Coach',
  mercatoLabel: 'Réseau',
  playerLabel: 'Coach',
  cvLabel: 'Parcours & diplômes',
  entrySub: 'Tactique IA · effectif · matchs · IA',
};

const PARENT_IDENTITY: UniverseIdentity = {
  id: 'parent',
  productName: PRODAY_PARENT_BRAND.name,
  tagline: PRODAY_PARENT_BRAND.tagline,
  heroLine: 'Accompagner\nsans étouffer.',
  mission:
    'Superviser le parcours de votre enfant : messages, agenda, retards coach, temps d’écran et trajets.',
  accentLabel: 'Parent',
  mercatoLabel: 'Famille',
  playerLabel: 'Enfant',
  cvLabel: 'Contrôle parental',
  entrySub: 'Pôle dédié — lié au compte joueur mineur',
};

const SPONSOR_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_SPONSOR_BRAND.name,
  tagline: PRODAY_SPONSOR_BRAND.tagline,
  heroLine: 'Votre marque\nsur le terrain.',
  mission:
    'Campagnes géolocalisées, tableau de bord ROI et vitrine vérifiée. Pour les équipes marketing.',
  accentLabel: 'Sponsor',
  mercatoLabel: 'Campagnes',
  playerLabel: 'Marque',
  cvLabel: 'Offres & ROI',
  entrySub: 'Visibilité mesurée · clubs · financement local',
};

export function getCarouselPoleIdentity(pole: CarouselPoleId): UniverseIdentity {
  switch (pole) {
    case 'joueur':
    case 'amateur':
    case 'pro_player':
      return JOUEUR_IDENTITY;
    case 'supporter':
      return SUPPORTER_IDENTITY;
    case 'pro_club':
    case 'evenements':
      return PRO_CLUB_IDENTITY;
    case 'president':
      return PRESIDENT_IDENTITY;
    case 'coach':
    case 'pro_staff':
      return COACH_IDENTITY;
    case 'parent':
      return PARENT_IDENTITY;
    case 'sponsor':
      return SPONSOR_IDENTITY;
    case 'sante':
      return SANTE_IDENTITY;
    default:
      return PRO_IDENTITY;
  }
}
