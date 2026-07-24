import { CAROUSEL_POLE_ORDER, type CarouselPoleId } from '../../../models/CarouselPole';

/**
 * Carousel pré-connexion — pôles affichés au lancement (doc architecture §14).
 *
 * homme/woman fusionnés dans Amateur (genre à l'inscription).
 * pro scindé en pro_player, pro_club, pro_staff (stockage `product_line: pro` inchangé).
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
  amateur: ['Mercato local', 'Matchs', 'Joueur & coach'],
  supporter: ['Matchs live', 'Reels', 'Fil'],
  pro_player: ['Carrière', 'Opportunités', 'Réels'],
  pro_club: ['Structure', 'Recrutement', 'Calendrier'],
  pro_staff: ['Mandats', 'Scouting', 'Convocations'],
  sponsor: ['Campagnes', 'ROI', 'Clubs'],
  sante: ['Kiné', 'Ostéo', 'Médecin', 'Prépa', 'Mental', 'Nutrition', 'Podologue'],
};
