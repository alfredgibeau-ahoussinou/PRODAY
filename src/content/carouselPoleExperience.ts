import type { CarouselPoleId } from '../models/CarouselPole';
import type { UniverseIdentity } from './brandExperience';
import {
  PRO_IDENTITY,
  SANTE_IDENTITY,
  SUPPORTER_IDENTITY,
} from './brandExperience';
import {
  PRODAY_PRO_CLUB_BRAND,
  PRODAY_PRO_STAFF_BRAND,
  PRODAY_SPONSOR_BRAND,
} from '../models/ProductLine';

const JOUEUR_IDENTITY: UniverseIdentity = {
  id: 'amateur',
  productName: 'Pro Day Joueur',
  tagline: 'AMATEUR · CENTRE · PRO',
  heroLine: 'Amateur\n→ Pro.',
  mission:
    'Un seul espace joueur. Badges Amateur, Centre / Aspirant ou Professionnel. Signature pro : même profil, badge mis à jour.',
  accentLabel: 'Joueur',
  mercatoLabel: 'Mercato',
  playerLabel: 'Joueur',
  cvLabel: 'CV & portfolio',
  entrySub: 'Du district au contrat — sans changer d\'environnement',
};

const PRO_CLUB_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRO_CLUB_BRAND.name,
  tagline: PRODAY_PRO_CLUB_BRAND.tagline,
  heroLine: 'Votre structure\nconnectée.',
  mission:
    'Équipes, pipeline candidatures kanban et vitrine. Calendrier & convocations : Pôle Staff.',
  accentLabel: 'Club',
  mercatoLabel: 'Recrutement',
  playerLabel: 'Structure',
  cvLabel: 'Vitrine club',
  entrySub: 'Dirigeants et staff administratif. Structure, effectifs et annonces',
};

const PRO_STAFF_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRO_STAFF_BRAND.name,
  tagline: PRODAY_PRO_STAFF_BRAND.tagline,
  heroLine: 'Le staff\nau centre.',
  mission:
    'Coach, agent, recruteur. Calendrier structure, convocations premium, mandats et scouting.',
  accentLabel: 'Staff',
  mercatoLabel: 'Réseau pro',
  playerLabel: 'Staff',
  cvLabel: 'Profil métier',
  entrySub: 'Coach · Agent · Recruteur · Calendrier',
};

const EVENEMENTS_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: 'Pro Day Événements',
  tagline: 'TOURNOIS · ACADÉMIES · DÉTECTIONS',
  heroLine: 'Vos événements\nfootball.',
  mission:
    'Créez tournois, stages, détections et showcases. Inscriptions, listes, résultats et médias.',
  accentLabel: 'Événements',
  mercatoLabel: 'Inscriptions',
  playerLabel: 'Organisateur',
  cvLabel: 'Événement',
  entrySub: 'Organisateurs · tournois · camps · showcases',
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
      return PRO_CLUB_IDENTITY;
    case 'pro_staff':
      return PRO_STAFF_IDENTITY;
    case 'evenements':
      return EVENEMENTS_IDENTITY;
    case 'sponsor':
      return SPONSOR_IDENTITY;
    case 'sante':
      return SANTE_IDENTITY;
    default:
      return PRO_IDENTITY;
  }
}
