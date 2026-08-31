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
