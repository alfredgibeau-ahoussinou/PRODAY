import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { ClubNavItemId } from '../../club/navigation/clubNavConfig';
import { useProductLine } from '../../../context/ProductLineContext';

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
 * Le mode shell est piloté par `clubShellMode` (carousel / préférences),
 * pour que Président soit un pôle sélectionnable lié au Club.
 */
export function PresidentShellBridgeProvider({ children }: { children: React.ReactNode }) {
  const { clubShellMode, setClubShellMode } = useProductLine();
  const [pendingClubNav, setPendingClubNav] = useState<ClubNavItemId | null>(null);

  const isPresidentShell = clubShellMode === 'president';

  const openPresident = useCallback(() => {
    void setClubShellMode('president');
  }, [setClubShellMode]);

  const closePresident = useCallback(
    (opts?: { clubNav?: ClubNavItemId }) => {
      if (opts?.clubNav) setPendingClubNav(opts.clubNav);
      void setClubShellMode('club');
    },
    [setClubShellMode],
  );

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
