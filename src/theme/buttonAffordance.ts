import type { ViewStyle } from 'react-native';
import type { AppColors } from './universeTheme';

/** Coque bouton secondaire / ghost — bordure et fond lisibles sur toutes les lignes produit. */
export function secondaryButtonShell(c: AppColors): ViewStyle {
  return {
    borderWidth: 1.5,
    borderColor: c.borderStrong,
    backgroundColor: c.surfaceMuted,
  };
}

/** Libellé d’onglet inactif (évite opacity globale qui grise tout). */
export function tabRailLabelStyle(c: AppColors, active: boolean) {
  return {
    fontWeight: (active ? '800' : '700') as '700' | '800',
    color: active ? c.text : c.textMuted,
  };
}
