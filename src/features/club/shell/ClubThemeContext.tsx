import React, { createContext, useContext, useMemo } from 'react';
import { CLUB_TOKENS, type ClubThemeTokens } from '../theme/clubTokens';

type ClubThemeContextValue = {
  tokens: ClubThemeTokens;
};

const ClubThemeContext = createContext<ClubThemeContextValue | null>(null);

export function ClubThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => ({ tokens: CLUB_TOKENS }), []);
  return (
    <ClubThemeContext.Provider value={value}>{children}</ClubThemeContext.Provider>
  );
}

export function useClubTheme(): ClubThemeContextValue {
  const ctx = useContext(ClubThemeContext);
  if (!ctx) {
    return { tokens: CLUB_TOKENS };
  }
  return ctx;
}
