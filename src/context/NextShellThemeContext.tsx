import React, { createContext, useContext, useMemo } from 'react';
import type { ProductLineId } from '../models/ProductLine';
import type { AppColors } from '../theme/universeTheme';
import { nextLegacyAppColors } from '../proday-next/design-system/legacyAppColors';

type NextShellThemeValue = {
  colors: AppColors;
  /** Contenu legacy embarqué dans NextDetailShell — masque les headers dupliqués. */
  embedded: boolean;
};

const NextShellThemeContext = createContext<NextShellThemeValue | null>(null);

export const NextShellThemeProvider: React.FC<{
  productLine: ProductLineId;
  embedded?: boolean;
  children: React.ReactNode;
}> = ({ productLine, embedded = false, children }) => {
  const value = useMemo(
    () => ({
      colors: nextLegacyAppColors(productLine),
      embedded,
    }),
    [productLine, embedded]
  );

  return (
    <NextShellThemeContext.Provider value={value}>{children}</NextShellThemeContext.Provider>
  );
};

export function useNextShellTheme(): NextShellThemeValue | null {
  return useContext(NextShellThemeContext);
}

export function useNextShellEmbedded(): boolean {
  return useNextShellTheme()?.embedded ?? false;
}
