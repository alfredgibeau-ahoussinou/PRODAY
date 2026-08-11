import React, { createContext, useContext } from 'react';
import type { ClubNavItemId } from '../navigation/clubNavConfig';

type ClubShellNavValue = {
  requestNav: (id: ClubNavItemId) => void;
};

const ClubShellNavContext = createContext<ClubShellNavValue | null>(null);

export function ClubShellNavProvider({
  requestNav,
  children,
}: {
  requestNav: (id: ClubNavItemId) => void;
  children: React.ReactNode;
}) {
  return (
    <ClubShellNavContext.Provider value={{ requestNav }}>{children}</ClubShellNavContext.Provider>
  );
}

export function useClubShellNav(): ClubShellNavValue | null {
  return useContext(ClubShellNavContext);
}
