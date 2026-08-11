import type { User } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { canonicalizeUserProductLine } from './productLineResolution';

const JOUEUR_POLE_LINES: ProductLineId[] = [
  'amateur',
  'homme',
  'woman',
  'pro_player',
];

function resolveLine(user: User): ProductLineId {
  return canonicalizeUserProductLine(user.product_line, user.role);
}

/** Compte joueur du pôle Joueur (Amateur + Pro Joueur) — UX jeu vidéo. */
export function isJoueurPolePlayer(profile: User | null | undefined): boolean {
  if (!profile || profile.role !== 'player') return false;
  return JOUEUR_POLE_LINES.includes(resolveLine(profile));
}

export function isJoueurPoleProductLine(line: ProductLineId | null | undefined): boolean {
  if (!line) return false;
  return JOUEUR_POLE_LINES.includes(line);
}
