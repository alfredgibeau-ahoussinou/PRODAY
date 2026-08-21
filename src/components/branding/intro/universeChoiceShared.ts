/**
 * Carousel pré-connexion — 7 pôles : Joueur · Club · Président · Coach · Parent · Supporter · Sponsor.
 * Santé / Agent / Recruteur / Organisateur = rôles intégrés (hors vitrine).
 * Président partage le product_line Club.
 */
import {
  CAROUSEL_SHOWCASE_POLE_ORDER,
  type CarouselPoleId,
} from '../../../models/CarouselPole';

export const UNIVERSE_CHOICE_ORDER: CarouselPoleId[] = [...CAROUSEL_SHOWCASE_POLE_ORDER];

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
  joueur: ['Profil', 'Stats', 'Covoiturage'],
  amateur: ['Profil', 'Stats', 'Covoiturage'],
  supporter: ['Matchs live', 'Reels', 'Fil'],
  pro_player: ['Profil', 'Stats', 'Covoiturage'],
  pro_club: ['Équipes', 'Compétitions', 'Covoiturage'],
  president: ['Cockpit', 'Finances', 'Direction'],
  coach: ['Tactique IA', 'Effectif', 'IA'],
  pro_staff: ['Tactique IA', 'Effectif', 'IA'],
  parent: ['Supervision', 'Messages', 'Retards'],
  evenements: ['Tournois', 'Détections', 'Stages'],
  sponsor: ['Campagnes', 'ROI', 'Clubs'],
  sante: ['Annuaire', 'Agenda', 'Visio'],
};
