import React, { createContext, useContext } from 'react';
import type { CoachNavItemId } from '../navigation/coachNavConfig';

type CoachShellNavValue = {
  requestNav: (id: CoachNavItemId) => void;
  openHelp?: () => void;
  signOut?: () => void;
};

const CoachShellNavContext = createContext<CoachShellNavValue | null>(null);

export function CoachShellNavProvider({
  requestNav,
  openHelp,
  signOut,
  children,
}: {
  requestNav: (id: CoachNavItemId) => void;
  openHelp?: () => void;
  signOut?: () => void;
  children: React.ReactNode;
}) {
  return (
    <CoachShellNavContext.Provider value={{ requestNav, openHelp, signOut }}>
      {children}
    </CoachShellNavContext.Provider>
  );
}

export function useCoachShellNav(): CoachShellNavValue | null {
  return useContext(CoachShellNavContext);
}
