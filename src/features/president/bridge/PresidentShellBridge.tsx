import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { ClubNavItemId } from '../../club/navigation/clubNavConfig';

type PresidentShellBridgeValue = {
  isPresidentShell: boolean;
  openPresident: () => void;
  closePresident: (opts?: { clubNav?: ClubNavItemId }) => void;
  pendingClubNav: ClubNavItemId | null;
  consumePendingClubNav: () => ClubNavItemId | null;
};

const PresidentShellBridgeContext = createContext<PresidentShellBridgeValue | null>(null);

/**
 * Bridge Club ↔ Président — bascule de shell sans dupliquer les données.
 */
export function PresidentShellBridgeProvider({ children }: { children: React.ReactNode }) {
  const [isPresidentShell, setIsPresidentShell] = useState(false);
  const [pendingClubNav, setPendingClubNav] = useState<ClubNavItemId | null>(null);

  const openPresident = useCallback(() => {
    setIsPresidentShell(true);
  }, []);

  const closePresident = useCallback((opts?: { clubNav?: ClubNavItemId }) => {
    if (opts?.clubNav) setPendingClubNav(opts.clubNav);
    setIsPresidentShell(false);
  }, []);

  const consumePendingClubNav = useCallback(() => {
    const next = pendingClubNav;
    if (next) setPendingClubNav(null);
    return next;
  }, [pendingClubNav]);

  const value = useMemo(
    () => ({
      isPresidentShell,
      openPresident,
      closePresident,
      pendingClubNav,
      consumePendingClubNav,
    }),
    [
      isPresidentShell,
      openPresident,
      closePresident,
      pendingClubNav,
      consumePendingClubNav,
    ],
  );

  return (
    <PresidentShellBridgeContext.Provider value={value}>
      {children}
    </PresidentShellBridgeContext.Provider>
  );
}

export function usePresidentShellBridge(): PresidentShellBridgeValue | null {
  return useContext(PresidentShellBridgeContext);
}
