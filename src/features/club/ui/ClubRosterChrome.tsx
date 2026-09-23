/**
 * Annuaire joueurs **Club** — enveloppe de thème uniquement.
 *
 * La composition (recherche, puces de filtre, rangées, fiche joueur) vit dans
 * `features/roster/rosterDirectory.tsx` et est partagée avec le pôle Coach : le
 * pôle Club n'apporte ici que ses jetons de surface et son composant texte.
 * Conséquence voulue : impossible de faire dériver l'annuaire des deux pôles —
 * c'était le cas de deux implémentations distinctes, à corriger deux fois.
 */
import React, { type ComponentProps } from 'react';
import { useClubTheme } from '../shell/ClubThemeContext';
import { ClubText } from './clubUi';
import {
  RosterChromeProvider,
  RosterDirectory,
  RosterProfileSheet,
  type RosterChromeText,
} from '../../roster/rosterDirectory';

/** Adaptateur stable du composant texte Club (identité constante entre rendus). */
const ClubRosterText: RosterChromeText = (props) => <ClubText {...props} />;

export function ClubRosterDirectory(props: ComponentProps<typeof RosterDirectory>) {
  const { tokens } = useClubTheme();
  return (
    <RosterChromeProvider tokens={tokens} Text={ClubRosterText}>
      <RosterDirectory {...props} />
    </RosterChromeProvider>
  );
}

export function ClubRosterProfileSheet(props: ComponentProps<typeof RosterProfileSheet>) {
  const { tokens } = useClubTheme();
  return (
    <RosterChromeProvider tokens={tokens} Text={ClubRosterText}>
      <RosterProfileSheet {...props} />
    </RosterChromeProvider>
  );
}
