import type { ProductLineId } from '../../models/ProductLine';
import type { SignupPageId } from './signupFlowConfig';
import { getManStepMeta } from './signupManConfig';
import { getWomanStepMeta } from './signupWomanConfig';

/** Métadonnées d’étape pour les parcours joueur / joueuse (Man & Woman). */
export function getPlayerStepMeta(line: ProductLineId, page: SignupPageId) {
  if (line === 'woman') return getWomanStepMeta(page);
  return getManStepMeta(page);
}
