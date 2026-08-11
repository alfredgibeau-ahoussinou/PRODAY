import React, { createContext, useContext } from 'react';
import type { CoachNavItemId } from '../navigation/coachNavConfig';

type CoachShellNavValue = {
  requestNav: (id: CoachNavItemId) => void;
};

const CoachShellNavContext = createContext<CoachShellNavValue | null>(null);

export function CoachShellNavProvider({
  requestNav,
  children,
}: {
  requestNav: (id: CoachNavItemId) => void;
  children: React.ReactNode;
}) {
  return (
    <CoachShellNavContext.Provider value={{ requestNav }}>{children}</CoachShellNavContext.Provider>
  );
}

export function useCoachShellNav(): CoachShellNavValue | null {
  return useContext(CoachShellNavContext);
}
