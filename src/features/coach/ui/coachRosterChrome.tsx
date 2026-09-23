/**
 * Annuaire joueurs **Coach** — enveloppe de thème uniquement.
 *
 * Même composition que le pôle Club/Admin (`features/roster/rosterDirectory`),
 * seuls les jetons de surface changent. C'est la garantie que la liste
 * d'effectif Coach et l'annuaire Club gardent la même recherche, les mêmes
 * puces de filtre, les mêmes rangées et la même fiche joueur.
 */
import React, { type ComponentProps } from 'react';
import { useCoachTheme } from '../shell/CoachThemeContext';
import { CoachText } from '../../../components/coach/coachPortalUi';
import {
  RosterChromeProvider,
  RosterDirectory,
  RosterProfileSheet,
  type RosterChromeText,
} from '../../roster/rosterDirectory';

/** Adaptateur stable du composant texte Coach (identité constante entre rendus). */
const CoachRosterText: RosterChromeText = (props) => <CoachText {...props} />;

export function CoachRosterDirectory(props: ComponentProps<typeof RosterDirectory>) {
  const { tokens } = useCoachTheme();
  return (
    <RosterChromeProvider tokens={tokens} Text={CoachRosterText}>
      <RosterDirectory {...props} />
    </RosterChromeProvider>
  );
}

export function CoachRosterProfileSheet(props: ComponentProps<typeof RosterProfileSheet>) {
  const { tokens } = useCoachTheme();
  return (
    <RosterChromeProvider tokens={tokens} Text={CoachRosterText}>
      <RosterProfileSheet {...props} />
    </RosterChromeProvider>
  );
}
