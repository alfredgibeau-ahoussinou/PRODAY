import React, { createContext, useContext, useMemo } from 'react';
import { PRESIDENT_TOKENS, type PresidentThemeTokens } from '../theme/presidentTokens';

type PresidentThemeValue = {
  tokens: PresidentThemeTokens;
};

const PresidentThemeContext = createContext<PresidentThemeValue>({
  tokens: PRESIDENT_TOKENS,
});

export function PresidentThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => ({ tokens: PRESIDENT_TOKENS }), []);
  return (
    <PresidentThemeContext.Provider value={value}>{children}</PresidentThemeContext.Provider>
  );
}

export function usePresidentTheme(): PresidentThemeValue {
  return useContext(PresidentThemeContext);
}
