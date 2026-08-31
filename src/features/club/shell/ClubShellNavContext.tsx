import React, { createContext, useContext } from 'react';
import type { ClubCreateActionId, ClubNavItemId } from '../navigation/clubNavConfig';

type ClubShellNavValue = {
  requestNav: (id: ClubNavItemId) => void;
  openCreate?: (action?: ClubCreateActionId) => void;
  openHelp?: () => void;
  /** Ouvre le Pôle Président (dirigeants autorisés). */
  openPresident?: () => void;
  signOut?: () => void;
  /** Équipe sélectionnée (espace équipe). */
  selectedTeamId?: string | null;
  setSelectedTeamId?: (id: string | null) => void;
  /** Joueur sélectionné (fiche). */
  selectedPlayerUid?: string | null;
  setSelectedPlayerUid?: (uid: string | null) => void;
};

const ClubShellNavContext = createContext<ClubShellNavValue | null>(null);

export function ClubShellNavProvider({
  requestNav,
  openCreate,
  openHelp,
  openPresident,
  signOut,
  selectedTeamId,
  setSelectedTeamId,
  selectedPlayerUid,
  setSelectedPlayerUid,
  children,
}: ClubShellNavValue & { children: React.ReactNode }) {
  return (
    <ClubShellNavContext.Provider
      value={{
        requestNav,
        openCreate,
        openHelp,
        openPresident,
        signOut,
        selectedTeamId,
        setSelectedTeamId,
        selectedPlayerUid,
        setSelectedPlayerUid,
      }}
    >
      {children}
    </ClubShellNavContext.Provider>
  );
}

export function useClubShellNav(): ClubShellNavValue | null {
  return useContext(ClubShellNavContext);
}
