import React, { createContext, useContext, useMemo } from 'react';
import type { StyleSheet } from 'react-native';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
import {
  type CarpoolUiPalette,
  carpoolPaletteDefault,
  carpoolPaletteFromCoach,
} from '../../utils/carpoolUiPalette';

export type { CarpoolUiPalette } from '../../utils/carpoolUiPalette';
export { carpoolPaletteDefault, carpoolPaletteFromCoach } from '../../utils/carpoolUiPalette';

const CarpoolUiContext = createContext<CarpoolUiPalette>(carpoolPaletteDefault());

export function CarpoolUiProvider({
  children,
  coachShell = false,
}: {
  children: React.ReactNode;
  coachShell?: boolean;
}) {
  const coachTokens = useCoachTokens();
  const palette = useMemo(
    () => (coachShell ? carpoolPaletteFromCoach(coachTokens) : carpoolPaletteDefault()),
    [coachShell, coachTokens],
  );

  return <CarpoolUiContext.Provider value={palette}>{children}</CarpoolUiContext.Provider>;
}

export function useCarpoolUi(): CarpoolUiPalette {
  return useContext(CarpoolUiContext);
}

/** Styles memoïsés sur la palette covoiturage (coach ou joueur). */
export function useCarpoolThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (palette: CarpoolUiPalette) => T,
): T {
  const palette = useCarpoolUi();
  return useMemo(() => createStyles(palette), [palette]);
}
