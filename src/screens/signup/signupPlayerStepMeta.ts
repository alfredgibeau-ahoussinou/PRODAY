import type { ProductLineId } from '../../models/ProductLine';
import type { SignupPageId } from './signupFlowConfig';
import { getManStepMeta } from './signupManConfig';
import { getWomanStepMeta } from './signupWomanConfig';
import type { TranslateFn } from '../../i18n/types';

/** Métadonnées d’étape pour les parcours joueur / joueuse (Man & Woman). */
export function getPlayerStepMeta(
  line: ProductLineId,
  page: SignupPageId,
  t?: TranslateFn
) {
  if (line === 'woman') return getWomanStepMeta(page, t);
  return getManStepMeta(page, t);
}
