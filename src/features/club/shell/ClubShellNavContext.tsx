import React, { createContext, useContext } from 'react';
import type { ClubCreateActionId, ClubNavItemId } from '../navigation/clubNavConfig';

export type ClubNavOptions = {
  replace?: boolean;
  clearHistory?: boolean;
};

export type ClubShellNavValue = {
  history?: ClubNavItemId[];
  canGoBack?: boolean;
  goBack?: () => void;
  requestNav: (id: ClubNavItemId, options?: ClubNavOptions) => void;
  openCreate?: (action?: ClubCreateActionId) => void;
  openHelp?: () => void;
  /** Ouvre le Pôle Président (dirigeants autorisés). */
  openPresident?: () => void;
  /** Ouvre la recherche club (personnes, équipes, événements, modules). */
  openSearch?: () => void;
  signOut?: () => void;
  /** Équipe sélectionnée (espace équipe). */
  selectedTeamId?: string | null;
  setSelectedTeamId?: (id: string | null) => void;
  /** Joueur sélectionné (fiche). */
  selectedPlayerUid?: string | null;
  setSelectedPlayerUid?: (uid: string | null) => void;
  /** Ouvre Joueurs sur le filtre « En attente » (adhésions à confirmer). */
  openPlayersPending?: () => void;
  /** Consommé par ClubPlayersScreen puis remis à false. */
  playersPendingFocus?: boolean;
  clearPlayersPendingFocus?: () => void;
};

const ClubShellNavContext = createContext<ClubShellNavValue | null>(null);

export function ClubShellNavProvider({
  history = [],
  canGoBack = false,
  goBack = () => {},
  requestNav,
  openCreate,
  openHelp,
  openPresident,
  openSearch,
  signOut,
  selectedTeamId,
  setSelectedTeamId,
  selectedPlayerUid,
  setSelectedPlayerUid,
  openPlayersPending,
  playersPendingFocus,
  clearPlayersPendingFocus,
  children,
}: ClubShellNavValue & { children: React.ReactNode }) {
  return (
    <ClubShellNavContext.Provider
      value={{
        history,
        canGoBack,
        goBack,
        requestNav,
        openCreate,
        openHelp,
        openPresident,
        openSearch,
        signOut,
        selectedTeamId,
        setSelectedTeamId,
        selectedPlayerUid,
        setSelectedPlayerUid,
        openPlayersPending,
        playersPendingFocus,
        clearPlayersPendingFocus,
      }}
    >
      {children}
    </ClubShellNavContext.Provider>
  );
}

export function useClubShellNav(): ClubShellNavValue | null {
  return useContext(ClubShellNavContext);
}
