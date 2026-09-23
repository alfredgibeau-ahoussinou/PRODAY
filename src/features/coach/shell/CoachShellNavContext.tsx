import React, { createContext, useContext } from 'react';
import type { CoachNavItemId } from '../navigation/coachNavConfig';

export type CoachNavOptions = {
  replace?: boolean;
  clearHistory?: boolean;
};

export type CoachShellNavValue = {
  history: CoachNavItemId[];
  canGoBack: boolean;
  goBack: () => void;
  requestNav: (id: CoachNavItemId, options?: CoachNavOptions) => void;
  openHelp?: () => void;
  signOut?: () => void;
};

const CoachShellNavContext = createContext<CoachShellNavValue | null>(null);

export function CoachShellNavProvider({
  history = [],
  canGoBack = false,
  goBack = () => {},
  requestNav,
  openHelp,
  signOut,
  children,
}: {
  history?: CoachNavItemId[];
  canGoBack?: boolean;
  goBack?: () => void;
  requestNav: (id: CoachNavItemId, options?: CoachNavOptions) => void;
  openHelp?: () => void;
  signOut?: () => void;
  children: React.ReactNode;
}) {
  return (
    <CoachShellNavContext.Provider
      value={{ history, canGoBack, goBack, requestNav, openHelp, signOut }}
    >
      {children}
    </CoachShellNavContext.Provider>
  );
}

export function useCoachShellNav(): CoachShellNavValue | null {
  return useContext(CoachShellNavContext);
}
