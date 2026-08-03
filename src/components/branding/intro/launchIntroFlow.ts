import type { CarouselPoleId } from '../../../models/CarouselPole';
import {
  normalizeCarouselPole,
  productLineToCarouselPole,
} from '../../../models/CarouselPole';
import type { ProductLineId } from '../../../models/ProductLine';
import type { UserRole } from '../../../models/User';

export type IntroExitAction = 'mark-complete' | 'close-manual';

/** Action à la fin de la transition selon le mode d'ouverture du sélecteur. */
export function resolveIntroExitAction(isManualOpen: boolean): IntroExitAction {
  return isManualOpen ? 'close-manual' : 'mark-complete';
}

/** Évite une transition inutile quand l'utilisateur confirme le pôle déjà actif. */
export function shouldSkipPoleTransition(
  chosenPole: CarouselPoleId,
  currentLine: ProductLineId | undefined,
  currentRole: UserRole | null | undefined,
  isManualReopen: boolean,
): boolean {
  if (!isManualReopen || currentLine == null) return false;
  const currentPole = productLineToCarouselPole(currentLine, currentRole);
  return normalizeCarouselPole(chosenPole) === normalizeCarouselPole(currentPole);
}
