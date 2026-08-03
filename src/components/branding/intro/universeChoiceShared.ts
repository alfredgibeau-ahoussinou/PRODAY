import { CAROUSEL_POLE_ORDER, type CarouselPoleId } from '../../../models/CarouselPole';

/**
 * Carousel pré-connexion — pôles affichés au lancement.
 * Amateur + Pro Joueur → Pôle Joueur ; + Pôle Événements.
 */
export const UNIVERSE_CHOICE_ORDER: CarouselPoleId[] = [...CAROUSEL_POLE_ORDER];

/** @deprecated — homme/woman ne sont plus des pôles carousel. */
export const LEGACY_UNIVERSE_CHOICE_ORDER = [
  'amateur',
  'supporter',
  'homme',
  'woman',
  'pro',
  'sante',
] as const;

export const UNIVERSE_FEATURE_CHIPS: Record<CarouselPoleId, string[]> = {
  joueur: ['Badges', 'Mercato', 'Carrière'],
  amateur: ['Badges', 'Mercato', 'Carrière'],
  supporter: ['Matchs live', 'Reels', 'Fil'],
  pro_player: ['Badges', 'Mercato', 'Carrière'],
  pro_club: ['Structure', 'Recrutement', 'Pipeline'],
  pro_staff: ['Mandats', 'Scouting', 'Convocations'],
  evenements: ['Tournois', 'Inscriptions', 'Détections'],
  sponsor: ['Campagnes', 'ROI', 'Clubs'],
  sante: ['Kiné', 'Ostéo', 'Médecin', 'Prépa', 'Mental', 'Nutrition', 'Podologue'],
};
