import type { ProductLineId } from '../../models/ProductLine';
import type { SignupPageId } from './signupFlowConfig';
import { getAmateurStepMeta } from './signupAmateurConfig';
import { getProPlayerStepMeta } from './signupProPlayerConfig';
import type { TranslateFn } from '../../i18n/types';

/** Métadonnées d’étape pour les parcours joueur (Amateur & Pro Joueur). */
export function getPlayerStepMeta(
  line: ProductLineId,
  page: SignupPageId,
  t?: TranslateFn,
) {
  if (line === 'amateur') return getAmateurStepMeta(page, t);
  if (line === 'pro_player' || line === 'pro') return getProPlayerStepMeta(page, t);
  return getProPlayerStepMeta(page, t);
}
