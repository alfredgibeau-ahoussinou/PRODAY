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
    'Contrats, opportunités et portfolio. Pour les joueurs et les joueuses qui veulent progresser.',
  accentLabel: 'Pro Joueur',
  mercatoLabel: 'Opportunités',
  playerLabel: 'Joueur·euse pro',
  cvLabel: 'Portfolio scouting',
  entrySub: 'Joueurs et joueuses. Carrière, mandat agent et convocations staff',
};

const PRO_CLUB_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRO_CLUB_BRAND.name,
  tagline: PRODAY_PRO_CLUB_BRAND.tagline,
  heroLine: 'L’image de\nvotre club.',
  mission:
    'Vitrine, structure, annonces et partenariats. L’espace des présidents et dirigeants.',
  accentLabel: 'Pro Club',
  mercatoLabel: 'Recrutement',
  playerLabel: 'Structure',
  cvLabel: 'Vitrine club',
  entrySub: 'Présidents et dirigeants. Image, structure et annonces — pas l’effectif coach',
};

const PRO_STAFF_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRO_STAFF_BRAND.name,
  tagline: PRODAY_PRO_STAFF_BRAND.tagline,
  heroLine: 'Votre effectif\nen main.',
  mission:
    'Coach : effectif, entraînements et convocations. Agents, recruteurs et orga aussi.',
  accentLabel: 'Pro Staff',
  mercatoLabel: 'Réseau pro',
  playerLabel: 'Staff',
  cvLabel: 'Profil métier',
  entrySub: 'Coach · Agent · Recruteur · Organisateur — incompatible avec le pôle Club',
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
