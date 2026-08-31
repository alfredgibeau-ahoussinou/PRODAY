import React, { createContext, useContext, useMemo } from 'react';
import type { StyleSheet } from 'react-native';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import {
  type CarpoolUiPalette,
  carpoolPaletteDefault,
  carpoolPaletteFromCoach,
  carpoolPaletteFromPlayerTheme,
} from '../../utils/carpoolUiPalette';

export type { CarpoolUiPalette } from '../../utils/carpoolUiPalette';
export {
  carpoolPaletteDefault,
  carpoolPaletteFromCoach,
  carpoolPaletteFromJoueur,
  carpoolPaletteFromPlayerTheme,
} from '../../utils/carpoolUiPalette';

const CarpoolUiContext = createContext<CarpoolUiPalette>(carpoolPaletteDefault());

export function CarpoolUiProvider({
  children,
  coachShell = false,
  joueurShell = false,
}: {
  children: React.ReactNode;
  coachShell?: boolean;
  joueurShell?: boolean;
}) {
  const coachTokens = useCoachTokens();
  const playerColors = usePlayerThemeColors();
  const palette = useMemo(() => {
    if (coachShell) return carpoolPaletteFromCoach(coachTokens);
    if (joueurShell) return carpoolPaletteFromPlayerTheme(playerColors);
    return carpoolPaletteDefault();
  }, [coachShell, joueurShell, coachTokens, playerColors]);

  return <CarpoolUiContext.Provider value={palette}>{children}</CarpoolUiContext.Provider>;
}

export function useCarpoolUi(): CarpoolUiPalette {
  return useContext(CarpoolUiContext);
}

/** Styles memoïsés sur la palette covoiturage (coach / joueur / défaut). */
export function useCarpoolThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (palette: CarpoolUiPalette) => T,
): T {
  const palette = useCarpoolUi();
  return useMemo(() => createStyles(palette), [palette, createStyles]);
}
