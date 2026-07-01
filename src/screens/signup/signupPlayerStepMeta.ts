import type { ProductLineId } from '../../models/ProductLine';
import type { SignupPageId } from './signupFlowConfig';
import { getManStepMeta } from './signupManConfig';
import { getWomanStepMeta } from './signupWomanConfig';
import { getAmateurStepMeta } from './signupAmateurConfig';
import type { TranslateFn } from '../../i18n/types';

/** Métadonnées d’étape pour les parcours joueur (Amateur, Woman & Man legacy). */
export function getPlayerStepMeta(
  line: ProductLineId,
  page: SignupPageId,
  t?: TranslateFn
) {
  if (line === 'amateur') return getAmateurStepMeta(page, t);
  if (line === 'woman') return getWomanStepMeta(page, t);
  return getManStepMeta(page, t);
}
