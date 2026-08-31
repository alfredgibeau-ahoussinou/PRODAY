import React, { createContext, useContext } from 'react';
import type { ClubNavItemId } from '../../club/navigation/clubNavConfig';
import type { PresidentNavItemId } from '../navigation/presidentNavConfig';

type PresidentShellNavValue = {
  requestNav: (id: PresidentNavItemId) => void;
  /** Quitte le pôle et ouvre une destination Club (pilotage). */
  openClubDeepLink: (id: ClubNavItemId) => void;
  openCommandPalette?: () => void;
  exitToClub?: () => void;
  signOut?: () => void;
};

const PresidentShellNavContext = createContext<PresidentShellNavValue | null>(null);

export function PresidentShellNavProvider({
  requestNav,
  openClubDeepLink,
  openCommandPalette,
  exitToClub,
  signOut,
  children,
}: PresidentShellNavValue & { children: React.ReactNode }) {
  return (
    <PresidentShellNavContext.Provider
      value={{
        requestNav,
        openClubDeepLink,
        openCommandPalette,
        exitToClub,
        signOut,
      }}
    >
      {children}
    </PresidentShellNavContext.Provider>
  );
}

export function usePresidentShellNav(): PresidentShellNavValue | null {
  return useContext(PresidentShellNavContext);
}
