import type { ViewStyle } from 'react-native';
import type { CoachThemeTokens } from './coachTeamTheme';
import { proChip } from '../theme/professionalDesign';

/**
 * Contraste texte pastille coach.
 *
 * L'état actif se lit sur la **couleur du libellé** (accent), jamais sur un
 * aplat d'accent. C'est la règle de forme du registre professionnel partagé
 * (puce pilule, sélection au contour), la même que le pôle Club/Admin : les
 * deux pôles ne peuvent plus diverger sur ce point.
 */
export function coachChipTextProps(
  active: boolean,
  _tokens?: CoachThemeTokens,
): { inverse?: boolean; accent?: boolean; muted?: boolean } {
  return {
    inverse: false,
    accent: active,
    muted: !active,
  };
}

/**
 * Conteneur de puce coach — **géométrie partagée** (`proForm.chipHeight` /
 * `proForm.chipRadius`) : une puce du pôle Coach et une puce du pôle Club/Admin
 * ont la même hauteur cible de 44 et le même rayon pilule. La sélection est un
 * **contour d'accent** sur fond transparent, jamais un remplissage plein.
 *
 * La géométrie vient d'ici, et non de chaque écran : c'est ce qui manquait aux
 * puces du calendrier Coach, mesurées à 16 px de haut avant ce correctif.
 *
 * Depuis l'extraction de l'annuaire partagé, la recette vit dans le socle
 * (`proChip`) : les puces du pôle Coach et celles du pôle Club/Admin sont
 * littéralement le même objet, et non deux copies à garder synchronisées.
 */
export function coachChipContainerStyle(
  active: boolean,
  tokens: CoachThemeTokens,
): ViewStyle {
  return proChip(tokens, active);
}
