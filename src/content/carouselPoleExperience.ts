import type { CarouselPoleId } from '../models/CarouselPole';
import type { UniverseIdentity } from './brandExperience';
import {
  AMATEUR_IDENTITY,
  PRO_IDENTITY,
  SANTE_IDENTITY,
  SUPPORTER_IDENTITY,
} from './brandExperience';
import {
  PRODAY_PRO_BRAND,
  PRODAY_PRO_CLUB_BRAND,
  PRODAY_PRO_PLAYER_BRAND,
  PRODAY_PRO_STAFF_BRAND,
  PRODAY_SPONSOR_BRAND,
} from '../models/ProductLine';

const PRO_PLAYER_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRO_PLAYER_BRAND.name,
  tagline: PRODAY_PRO_PLAYER_BRAND.tagline,
  heroLine: 'Votre carrière\npro.',
  mission:
    'Contrat, opportunités, portfolio vidéo et logistique groupe — le cockpit du joueur professionnel.',
  accentLabel: 'Pro Joueur',
  mercatoLabel: 'Opportunités',
  playerLabel: 'Joueur pro',
  cvLabel: 'Portfolio scouting',
  entrySub: 'Joueur professionnel — carrière, mandat agent et convocations staff',
};

const PRO_CLUB_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRO_CLUB_BRAND.name,
  tagline: PRODAY_PRO_CLUB_BRAND.tagline,
  heroLine: 'Votre structure\nconnectée.',
  mission:
    'Équipes, recrutement local, calendrier et communication — la vitrine digitale du club.',
  accentLabel: 'Pro Club',
  mercatoLabel: 'Recrutement',
  playerLabel: 'Structure',
  cvLabel: 'Vitrine club',
  entrySub: 'Dirigeants et staff administratif — structure, effectifs et annonces',
};

const PRO_STAFF_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRO_STAFF_BRAND.name,
  tagline: PRODAY_PRO_STAFF_BRAND.tagline,
  heroLine: 'Le staff\nau centre.',
  mission:
    'Coach, agent, recruteur ou organisateur — mandats, scouting, convocations et réseau pro.',
  accentLabel: 'Pro Staff',
  mercatoLabel: 'Réseau pro',
  playerLabel: 'Staff',
  cvLabel: 'Profil métier',
  entrySub: 'Coach · Agent · Recruteur · Organisateur',
};

const SPONSOR_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_SPONSOR_BRAND.name,
  tagline: PRODAY_SPONSOR_BRAND.tagline,
  heroLine: 'Votre marque\nsur le terrain.',
  mission:
    'Campagnes géolocalisées, tableau de bord ROI et vitrine vérifiée — un espace corporate pour les décideurs marketing.',
  accentLabel: 'Sponsor',
  mercatoLabel: 'Campagnes',
  playerLabel: 'Marque',
  cvLabel: 'Offres & ROI',
  entrySub: 'Visibilité mesurée · clubs · financement local',
};

export function getCarouselPoleIdentity(pole: CarouselPoleId): UniverseIdentity {
  switch (pole) {
    case 'amateur':
      return AMATEUR_IDENTITY;
    case 'supporter':
      return SUPPORTER_IDENTITY;
    case 'pro_player':
      return PRO_PLAYER_IDENTITY;
    case 'pro_club':
      return PRO_CLUB_IDENTITY;
    case 'pro_staff':
      return PRO_STAFF_IDENTITY;
    case 'sponsor':
      return SPONSOR_IDENTITY;
    case 'sante':
      return SANTE_IDENTITY;
    default:
      return PRO_IDENTITY;
  }
}
