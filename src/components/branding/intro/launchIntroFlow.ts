import type { CarouselPoleId } from '../../../models/CarouselPole';
import {
  normalizeCarouselPole,
  productLineToCarouselPole,
} from '../../../models/CarouselPole';
import type { ClubShellMode } from '../../../models/ClubShellMode';
import type { ProductLineId } from '../../../models/ProductLine';
import type { UserRole } from '../../../models/User';

export type IntroExitAction = 'mark-complete' | 'close-manual';

/**
 * Timings sortie « Entrer dans [pôle] ».
 * Local BrandReveal ≈ 260 ms ; picker manuel délègue à Push (~220 ms) sans redo local.
 */
export const UNIVERSE_CONFIRM_LEAVE = {
  exitMs: 260,
  exitReducedMs: 90,
  veilMs: 110,
  /** PushScreenTransition quand skipLocalTransition. */
  pushExitMs: 220,
} as const;

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
  currentClubShellMode?: ClubShellMode | null,
): boolean {
  if (!isManualReopen || currentLine == null) return false;
  const currentPole = productLineToCarouselPole(
    currentLine,
    currentRole,
    currentClubShellMode,
  );
  return normalizeCarouselPole(chosenPole) === normalizeCarouselPole(currentPole);
}
